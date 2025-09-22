from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from models import UserRegister,AdminRegister, RefreshRequest
from database import users_collection, chats_collection, status_collection, admin_collection
from auth import hash_password, verify_password, create_access_token, get_current_user_id, get_current_user, create_refresh_token, verify_token, get_current_admin
from datetime import timedelta
from nearby_find.find import nearby_find
import json
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from openai import OpenAI
import os
from bson import ObjectId
from fastapi.security import HTTPBearer
import re
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import copy

app = FastAPI(title="[도래] 은빛지기 API")
security = HTTPBearer(auto_error=True)

class ChatRequest(BaseModel):
    user_input: str

openAI_Key = os.getenv("OPENAI_APIKEY")
client = OpenAI(api_key=openAI_Key) 

model_name = "nlp04/korean_sentiment_analysis_kcelectra"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
sentiment_pipe = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)

# 과거 채팅 데이터 학습 후 대화 진행
async def get_conversation_history(user_id):
    record = chats_collection.find_one({"user_id": ObjectId(user_id)})
    if record:
        return record.get("conversation", [
            {"role": "system", "content": "너는 노인분들의 친근한 상담사야. 건강과 우울도에 대해 판단하고 상담해줄거야."}
        ])
    else:
        return [{"role": "system", "content": "너는 노인분들의 친근한 상담사야. 건강과 우울도에 대해 판단하고 상담해줄거야."}]



# ===== API =====
@app.post("/register")
def register(user: UserRegister):
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    
    hashed_pw = hash_password(user.password)
    birth_datetime = datetime.combine(user.birth, datetime.min.time())
    users_collection.insert_one({
        "name": user.name,
        "password": hashed_pw,
        "address": user.address,
        "gender": user.gender,
        "birth": birth_datetime,
    })
    return {"msg": "회원가입 성공"}

@app.post("/admin/register")
def register(user: AdminRegister):
    if admin_collection.find_one({"id": user.id}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    
    hashed_pw = hash_password(user.password)
    admin_collection.insert_one({
        "id": user.id,
        "name": user.name,
        "password": hashed_pw,
    })
    return {"msg": "회원가입 성공"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"name": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="잘못된 이름 또는 비밀번호")

    access_token = create_access_token(data={"sub": str(user["_id"])}, expires_delta=timedelta(minutes=60))
    refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
    
    # DB에 refresh token 저장 (보안 위해)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"refresh_token": refresh_token}})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/admin/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = admin_collection.find_one({"id": form_data.username})
    print(user)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="잘못된 이름 또는 비밀번호")

    access_token = create_access_token(data={"sub": str(user["_id"])}, expires_delta=timedelta(minutes=60))
    refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
    
    # DB에 refresh token 저장 (보안 위해)
    admin_collection.update_one({"_id": user["_id"]}, {"$set": {"refresh_token": refresh_token}})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.get('/api/userinfo')
def userinfo(current_user: dict = Depends(get_current_user)):
    return {
        "name": current_user["name"],
        "address": current_user["address"],
        "gender": current_user["gender"],
        "birth": current_user["birth"],
    }

@app.get('/api/admininfo')
def userinfo(current_user: dict = Depends(get_current_admin)):
    return {
        "name": current_user["name"],
    }

@app.get("/api/chat/history", dependencies=[Depends(security)]) 
async def get_chat_history(user_id: str = Depends(get_current_user_id)):
    """로그인한 사용자의 이전 채팅 기록 불러오기"""
    record = chats_collection.find_one({"user_id": ObjectId(user_id)})
    print("정보: ",record)
    if not record:
        return {"conversation": []}  # 기록 없으면 빈 배열 반환

    return {"conversation": record.get("conversation", [])}

@app.post("/api/chat", dependencies=[Depends(security)])
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    user_input = req.user_input

    # DB에서 이전 대화 기록을 가져옵니다.
    conversation_history = await get_conversation_history(user_id)

    # 1️⃣ 감정 분석 
    sentiment_result = sentiment_pipe(user_input)[0]
    sentiment_label = sentiment_result["label"]
    sentiment_score = sentiment_result["score"]

    # 2️⃣ LLM 프롬프트 설계 
    user_message = f"""
사용자가 이렇게 말했습니다: "{user_input}"
감정 분석 결과: {sentiment_label} ({sentiment_score:.2f})
이전 대화를 고려하여 우울도를 0~10으로 점수화하고 공감하는 답변을 만들어 주세요. 그리고 사용자의 대화중 건강과 관련된 이상이 있으면 예측질병을 작성하세요.
JSON 형태로 결과를 출력해주세요:
{{"depression_score": 7, "response": "위로 멘트", "disease" : 복통}}
"""
    prompt = copy.deepcopy(conversation_history)
    prompt.append({"role": "user", "content": user_message})
    conversation_history.append({"role": "user", "content": user_input})
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=prompt
        )
        result_text = response.choices[0].message.content
        try:
            match = re.search(r"\{.*\}", result_text, re.DOTALL)
            if match:
                result_json = json.loads(match.group(0))
        except:
            result_json = {"depression_score": None, "response": result_text}
    except Exception as e:
        result_json = {"depression_score": None, "response": f"AI 호출 중 오류 발생: {str(e)}"}

    depression_score = result_json.get("depression_score")
    disease = result_json.get("disease")

    # 4️⃣ 대화 기록에 AI 응답 추가
    conversation_history.append({"role": "assistant", "content": result_json["response"]})

    # 채팅 기록 저장
    chats_collection.update_one(
        {"user_id": ObjectId(user_id)},  # 어떤 사용자의 문서를 찾을지 필터링
        {"$set": {"conversation": conversation_history}},  # 어떤 내용을 업데이트할지 설정
        upsert=True  # 문서가 없으면 새로 생성
    )
    

    status_data = {
        "sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "depression_score": depression_score,
        "disease" : disease
    }


    status_collection.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": status_data},
        upsert=True
    )

    # 유저 상태 업데이트

    return {
        "sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "depression_score": result_json["depression_score"],
        "disease" : disease,
        "ai_response": result_json["response"]
    }

@app.get("/api/userstatus", dependencies=[Depends(security)])
async def userstatus(user_id: str = Depends(get_current_user_id)):
    status = status_collection.find_one({"user_id": ObjectId(user_id)}, 
                                        {"_id": 0, "sentiment_label": 1, "sentiment_score": 1, "depression_score": 1, "disease": 1})
    if not status:
        status = {"sentiment_label": None, "sentiment_score": None, "disease": None}
    return status


@app.post("/refresh")
def refresh_token(req: RefreshRequest):
    payload = verify_token(req.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

    user_id = payload.get("sub")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("refresh_token") != req.refresh_token:
        raise HTTPException(status_code=401, detail=user.get("refresh_token"))

    new_access_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(minutes=60))
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.post("/admin/refresh")
def refresh_token(req: RefreshRequest):
    payload = verify_token(req.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")

    user_id = payload.get("sub")
    user = admin_collection.find_one({"_id": ObjectId(user_id)})
    print(user)
    if not user or user.get("refresh_token") != req.refresh_token:
        raise HTTPException(status_code=401, detail=user.get("refresh_token"))

    new_access_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(minutes=60))
    return {"access_token": new_access_token, "token_type": "bearer"}


@app.get("/api/nearby")
def nearby(address: str):
    res = nearby_find(address)
    if not res :
        return {}
    return res

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

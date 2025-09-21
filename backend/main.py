from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from models import UserRegister
from database import users_collection, chats_collection
from auth import hash_password, verify_password, create_access_token, get_current_user_id
from datetime import timedelta
import json
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from openai import OpenAI
import os
from bson import ObjectId
from fastapi.security import HTTPBearer

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
            {"role": "system", "content": "너는 노인분들의 친근한 상담사야..."}
        ])
    else:
        return [{"role": "system", "content": "너는 노인분들의 친근한 상담사야..."}]



# ===== API =====
@app.post("/register")
def register(user: UserRegister):
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    
    hashed_pw = hash_password(user.password)
    users_collection.insert_one({
        "name": user.name,
        "password": hashed_pw
    })
    return {"msg": "회원가입 성공"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"name": form_data.username})
    if not user:
        raise HTTPException(status_code=400, detail="잘못된 이름 또는 비밀번호")
    
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="잘못된 이름 또는 비밀번호")
    
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": str(user["_id"])} 
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/chat/history", dependencies=[Depends(security)]) 
async def get_chat_history(user_id: str = Depends(get_current_user_id)):
    """로그인한 사용자의 이전 채팅 기록 불러오기"""
    record = chats_collection.find_one({"user_id": ObjectId(user_id)})
    print("정보: ",record)
    if not record:
        return {"conversation": []}  # 기록 없으면 빈 배열 반환

    return {"conversation": record.get("conversation", [])}

@app.post("/api/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    user_input = req.user_input

    # DB에서 이전 대화 기록을 가져옵니다.
    conversation_history = await get_conversation_history(user_id)

    # 1️⃣ 감정 분석 (기존 코드와 동일)
    sentiment_result = sentiment_pipe(user_input)[0]
    sentiment_label = sentiment_result["label"]
    sentiment_score = sentiment_result["score"]

    # 2️⃣ LLM 프롬프트 설계 (기존 코드와 동일)
    user_message = f"""
사용자가 이렇게 말했습니다: "{user_input}"
감정 분석 결과: {sentiment_label} ({sentiment_score:.2f})
이전 대화를 고려하여 우울도를 0~10으로 점수화하고 공감하는 답변을 만들어 주세요.
JSON 형태로 결과를 출력해주세요:
{{"depression_score": 7, "response": "위로 멘트"}}
"""
    conversation_history.append({"role": "user", "content": user_message})

    # 3️⃣ LLM 호출 (기존 코드와 동일)
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=conversation_history
        )
        result_text = response.choices[0].message.content
        try:
            result_json = json.loads(result_text)
        except:
            result_json = {"depression_score": None, "response": result_text}
    except Exception as e:
        result_json = {"depression_score": None, "response": f"AI 호출 중 오류 발생: {str(e)}"}

    # 4️⃣ 대화 기록에 AI 응답 추가
    conversation_history.append({"role": "assistant", "content": result_json["response"]})

    # ⭐ 이 부분에서 DB에 채팅 기록을 저장 (업데이트 또는 생성) 합니다.
    await chats_collection.update_one(
        {"user_id": ObjectId(user_id)},  # 어떤 사용자의 문서를 찾을지 필터링
        {"$set": {"conversation": conversation_history}},  # 어떤 내용을 업데이트할지 설정
        upsert=True  # 문서가 없으면 새로 생성
    )

    # 5️⃣ API Response
    return {
        "sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "depression_score": result_json["depression_score"],
        "ai_response": result_json["response"]
    }

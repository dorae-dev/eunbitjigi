from pydantic import BaseModel
from datetime import date

class UserRegister(BaseModel):
    name: str
    password: str
    phonenumber: str
    address: str
    gender: str
    birth: date

class UserLogin(BaseModel):
    name: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

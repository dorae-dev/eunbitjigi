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

class AdminRegister(BaseModel):
    name: str
    id: str
    password: str

class AdminLogin(BaseModel):
    id: str
    password: str


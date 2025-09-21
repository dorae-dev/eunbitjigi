from pydantic import BaseModel
from datetime import date

class UserRegister(BaseModel):
    name: str
    password: str
    address: str
    gender: str
    birth: date

class UserLogin(BaseModel):
    name: str
    password: str

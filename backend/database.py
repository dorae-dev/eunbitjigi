# app/database.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URI")

client = MongoClient(MONGO_URL)
db = client["DB"]
users_collection = db["users"]
chats_collection = db["user_chats"]

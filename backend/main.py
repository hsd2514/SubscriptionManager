import logging
from fastapi import FastAPI, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import List
from datetime import date, datetime ,timedelta
from bson import ObjectId
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from starlette.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from jose import JWTError, jwt
import requests

# Configure logging to write to app.log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["your_database_name"]
users_collection = db["users"]

class TokenData(BaseModel):
    token: str

class Subscription(BaseModel):
    email: EmailStr
    name: str
    amount: float
    end_date: date

class SubscriptionResponse(BaseModel):
    sub_id: str
    email: EmailStr
    name: str
    amount: float
    end_date: str
    status: str

    @validator('end_date', pre=True, always=True)
    def convert_end_date(cls, v):
        if isinstance(v, datetime):
            return v.date().isoformat()
        return v

# Your Google Client ID and JWT settings
GOOGLE_CLIENT_ID = "854178614764-f09gu8tu505js4e37djp0mh9l8r21b07.apps.googleusercontent.com"
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=300)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/auth/callback")
async def auth_callback(token_data: TokenData, response: Response):
    token = token_data.token
    logging.info(f"Received token: {token}")
    
    try:
        id_info = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID, clock_skew_in_seconds=10)
        logging.info(f"ID info: {id_info}")
    except ValueError as e:
        logging.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Fetch user info from Google UserInfo endpoint
    user_info_response = id_info
    
    user_info = user_info_response
    logging.info(f"User info: {user_info}")
    
    user = users_collection.find_one({"email": user_info['email']})
    if not user:
        logging.info(f"New user detected, inserting into database: {user_info['email']}")
        users_collection.insert_one({
            "email": user_info['email'],
            "name": user_info['name'],
            "picture": user_info['picture']
        })
    else:
        logging.info(f"Existing user found: {user_info['email']}")
    
    access_token = create_access_token(data={"sub": user_info['email']})
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return {"message": "User authenticated successfully"}

@app.get("/verify-token")
async def verify_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"email": user["email"], "name": user["name"], "picture": user["picture"]}

@app.get("/protected-route")
async def protected_route(current_user: dict = Depends(verify_token)):
    return {"message": f"Hello, {current_user['name']}!"}

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "User logged out successfully"}

@app.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(subscription: Subscription):
    user = users_collection.find_one({"email": subscription.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sub_id = str(ObjectId())
    subscription_data = {
        "sub_id": sub_id,
        "name": subscription.name,
        "amount": subscription.amount,
        "end_date": subscription.end_date.isoformat()  # Convert date to string
    }

    users_collection.update_one(
        {"email": subscription.email},
        {"$push": {"subscriptions": subscription_data}}
    )

    return {
        "sub_id": sub_id,
        "email": subscription.email,
        "name": subscription.name,
        "amount": subscription.amount,
        "end_date": subscription.end_date.isoformat(),
        "status": "subscribed"
    }

@app.put("/edit-subscription/{sub_id}", response_model=SubscriptionResponse)
async def edit_subscription(sub_id: str, subscription: Subscription):
    user = users_collection.find_one({"email": subscription.email, "subscriptions.sub_id": sub_id})
    if not user:
        raise HTTPException(status_code=404, detail="Subscription not found")

    users_collection.update_one(
        {"email": subscription.email, "subscriptions.sub_id": sub_id},
        {"$set": {
            "subscriptions.$.name": subscription.name,
            "subscriptions.$.amount": subscription.amount,
            "subscriptions.$.end_date": subscription.end_date.isoformat()  # Convert date to string
        }}
    )

    return {
        "sub_id": sub_id,
        "email": subscription.email,
        "name": subscription.name,
        "amount": subscription.amount,
        "end_date": subscription.end_date.isoformat(),
        "status": "updated"
    }

@app.get("/subscriptions", response_model=List[SubscriptionResponse])
async def get_subscriptions(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    subscriptions = user.get("subscriptions", [])
    return [
        {
            "sub_id": sub["sub_id"],
            "email": user["email"],
            "name": sub["name"],
            "amount": sub["amount"],
            "end_date": sub["end_date"],
            "status": "subscribed"
        }
        for sub in subscriptions
    ]
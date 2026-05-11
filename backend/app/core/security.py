from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ✅ Security scheme (for Swagger + headers)
security = HTTPBearer()


# ✅ CREATE TOKEN (your code - slightly structured)
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ✅ DECODE TOKEN + GET CURRENT USER
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user = {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "first_name": payload.get("first_name"),
            "role": payload.get("role")
        }

        if user["user_id"] is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ✅ ADMIN CHECK
def require_admin(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ✅ USER CHECK 
def require_user(current_user = Depends(get_current_user)):
    if current_user["role"] != "user":
        raise HTTPException(status_code=403, detail="User access required")
    return current_user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import Register, Login, OTPRequest, OTPVerify
from app.services.authservice import hash_password, verify_password
from app.core.security import create_access_token
from app.services.email_service import send_otp_email

router = APIRouter()

otp_storage = {}

# ✅ Register (NO CHANGE)
@router.post("/register")
def register(user: Register, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)

    new_user = User(
        email=user.email,
        password=hashed_password,
        first_name=user.firstName,
        last_name=user.lastName
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# ✅ LOGIN WITH PASSWORD
@router.post("/login")
def login(data: Login, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ✅ SEND OTP
@router.post("/send-otp")
def send_otp(data: OTPRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(1000, 9999))

    otp_storage[data.email] = otp

    send_otp_email(data.email, otp)

    return {"message": "OTP sent successfully"}


# ✅ VERIFY OTP & LOGIN
@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):

    stored_otp = otp_storage.get(data.email)

    if not stored_otp or stored_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(User).filter(User.email == data.email).first()

    token = create_access_token({
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "role": user.role
    })

    # ✅ Remove OTP after verification
    otp_storage.pop(data.email, None)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random

from app.core.database import get_db
from app.models.user import User
# ✅ Ingested FirstPasswordResetRequest alongside your existing schemas
from app.schemas.user import Register, Login, OTPRequest, OTPVerify, FirstPasswordResetRequest
from app.services.authservice import hash_password, verify_password
from app.core.security import create_access_token, get_current_user

router = APIRouter()

otp_storage = {}


# ✅ REGISTER (NO CHANGE)
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
        last_name=user.lastName,
        role=getattr(user, 'role', 'user')
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# ✅ LOGIN WITH PASSWORD (UPDATED RULE CHECK LOGIC)
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

    # 🔒 ROLE ISOLATION LOGIC:
    # Evaluate role to flag 'is_first_login' true if and only if they are an instructor.
    # Regular students ('user') or admins default immediately to False.
    is_first_time = False
    if str(user.role).lower() == "instructor":
        is_first_time = getattr(user, "is_first_login", False)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "is_first_login": is_first_time  # 🎯 Returns True ONLY for fresh Instructors
    }


# ✅ SEND OTP (NO CHANGE)
@router.post("/send-otp")
def send_otp(data: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(1000, 9999))
    otp_storage[data.email] = otp

    email_status = send_otp_email(data.email, otp)
    print(f"DEBUG: OTP for {data.email} is {otp}") 

    if not email_status:
        return {"message": "OTP generated, but email failed to send. Check server console."}

    return {"message": "OTP sent successfully"}


# ✅ VERIFY OTP & LOGIN (UPDATED RULE CHECK LOGIC)
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

    otp_storage.pop(data.email, None)

    # 🔒 Match instructor check inside the OTP lane payload dictionary too
    is_first_time = False
    if str(user.role).lower() == "instructor":
        is_first_time = getattr(user, "is_first_login", False)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "is_first_login": is_first_time
    }


# ─── 🚀 INSTRUCTOR FIRST LOGIN PASSWORD RESET ROUTE ───

@router.put("/reset-first-password")
def reset_first_password(
    data: FirstPasswordResetRequest,  # ✅ Clean payload handling parsing matching your request
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)  # 🔒 Enforces token verification check
):
    """
    Overwrites the temporary admin password with a permanent secure choice.
    Flips the tracking flag back to False.
    """
    # Double Layer Guard Check: Deny non-instructors instantly
    if str(current_user.get("role", "")).lower() != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access Denied: This checkpoint is reserved for instructors."
        )

    if not data.password or len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile account row not found.")

    # Apply your centralized hash helper and drop the tracking lock flag to False
    user.password = hash_password(data.password)
    user.is_first_login = False 
    
    db.commit()
    return {"status": "success", "message": "Instructor password activated successfully."}

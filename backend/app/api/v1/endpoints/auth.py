from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import Register
from app.services.authservice import hash_password

router = APIRouter()


@router.post("/register")
def register(user: Register, db: Session = Depends(get_db)):

    # ✅ Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # ✅ Hash password
    hashed_password = hash_password(user.password)

    # ✅ Create new user
    new_user = User(
        email=user.email,
        password=hashed_password,
        first_name=user.firstName,
        last_name=user.lastName
    )

    # ✅ Save to DB
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

# 📂 File: app/models/user.py
from app.core.database import Base
from sqlalchemy import Column, String, Integer, TIMESTAMP, text, Boolean

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
 
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
 
    role = Column(String, server_default='user')
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'))
    
    # 🎯 THE RECTIFIED COLUMN:
    # We default to False so normal students can log in instantly without issues.
    is_first_login = Column(Boolean, default=False, nullable=False)

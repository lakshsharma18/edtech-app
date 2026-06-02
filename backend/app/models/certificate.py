from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from datetime import datetime
from app.core.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    file_path = Column(String, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
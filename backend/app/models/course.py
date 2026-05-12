from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

    price = Column(Float, default=0.0)
    thumbnail_url = Column(String, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # ✅ ADD THIS (VERY IMPORTANT)
    lessons = relationship(
        "Lesson",
        backref="course",
        cascade="all, delete-orphan"
    )
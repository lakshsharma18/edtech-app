from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, text
from app.core.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
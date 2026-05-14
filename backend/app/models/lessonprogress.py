from sqlalchemy import Column, Integer, Boolean, ForeignKey, UniqueConstraint
from app.core.database import Base

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    # ✅ IMPORTANT CHANGE
    lesson_id = Column(
        Integer,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False
    )

    completed = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="unique_user_lesson"),
    )
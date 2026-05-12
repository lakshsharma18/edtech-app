from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)

    video_url = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    # ✅ UPDATE THIS LINE
    course_id = Column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False
    )
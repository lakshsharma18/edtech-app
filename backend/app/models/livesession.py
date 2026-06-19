from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, index=True)
    
    # 🎯 Course Anchor Link: Ensures stream is tied strictly to a specific course ID
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    
    # Footprint Tracking: Logs exactly which instructor started the stream
    instructor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 🔴 Real-Time Room Status Flag Toggle
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), nullable=False)

    # ORM shortcuts to easily grab metadata across models
    course = relationship("Course", backref="live_sessions")
    instructor = relationship("User", backref="live_sessions")

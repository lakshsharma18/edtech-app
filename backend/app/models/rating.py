from sqlalchemy import Column, Integer, ForeignKey, Text, CheckConstraint, UniqueConstraint, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base
 
class CourseRating(Base):
    __tablename__ = "course_ratings"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
   
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=True)
   
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()"))
 
    # Database Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        UniqueConstraint('user_id', 'course_id', name='unique_user_course_rating'),
    )
 
    # Relationships
    course = relationship("Course", back_populates="ratings")
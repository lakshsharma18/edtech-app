from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class CartItem(Base):
    __tablename__ = 'cart_items'

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'))

    # Relationships (Optional, but useful for clean data joins)
    user = relationship("User")
    course = relationship("Course")
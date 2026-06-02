from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    stripe_intent_id = Column(String, unique=True, index=True, nullable=False) # e.g., pi_3MxsKz...

    # Positional relationship foreign keys mapping back to core schemas
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)

    # Auditing ledger tracking metrics
    amount_paid = Column(Float, nullable=False)
    currency = Column(String, default="inr", nullable=False)
    status = Column(String, default="succeeded", nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), nullable=False)

    # ORM shortcuts to easily grab metadata across database models
    user = relationship("User", backref="payment_records")
    course = relationship("Course", backref="payment_records")

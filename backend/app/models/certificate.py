from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from datetime import datetime
from app.core.database import Base
<<<<<<< HEAD


class Certificate(Base):
    __tablename__ = "certificates"

=======
 
 
class Certificate(Base):
    __tablename__ = "certificates"
 
>>>>>>> 97e2e6f750a047fcfd7fb194a942ef4480a9cd05
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    file_path = Column(String, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
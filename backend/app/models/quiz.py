from sqlalchemy import Column, Integer, ForeignKey,Text,Boolean
from app.core.database import Base
<<<<<<< HEAD


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    passing_score = Column(Integer, default=60)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)


class Option(Base):
    __tablename__ = "options"

=======
 
 
class Quiz(Base):
    __tablename__ = "quizzes"
 
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    passing_score = Column(Integer, default=60)
 
 
class Question(Base):
    __tablename__ = "questions"
 
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
 
 
class Option(Base):
    __tablename__ = "options"
 
>>>>>>> 97e2e6f750a047fcfd7fb194a942ef4480a9cd05
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
<<<<<<< HEAD


class Attempt(Base):
    __tablename__ = "attempts"

=======
 
 
class Attempt(Base):
    __tablename__ = "attempts"
 
>>>>>>> 97e2e6f750a047fcfd7fb194a942ef4480a9cd05
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Integer, nullable=False)
    is_passed = Column(Boolean, default=False)
<<<<<<< HEAD
=======
 
 
>>>>>>> 97e2e6f750a047fcfd7fb194a942ef4480a9cd05

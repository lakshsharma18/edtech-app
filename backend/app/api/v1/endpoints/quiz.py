from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import re
import random
from app.core.database import get_db
from app.core.security import require_user
 
from app.models.quiz import Quiz
from app.models.quiz import Question
from app.models.quiz import Option
from app.models.course import Course
from app.schemas.quiz import SubmitQuiz
from app.models.quiz import Attempt
from app.core.config import GROQ_API_KEY
from groq import Groq
 
from app.models.quiz import Attempt, Quiz, Question, Option
# ✅ Configure Groq
client = Groq(api_key=GROQ_API_KEY)
 
router = APIRouter()
 
@router.post("/quiz/submit")
def submit_quiz(
    data: SubmitQuiz,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):
 
    questions = db.query(Question).filter(
        Question.quiz_id == data.quiz_id
    ).all()
 
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz questions not found")
 
    correct_answers = {}
 
    for q in questions:
        correct_option = db.query(Option).filter(
            Option.question_id == q.id,
            Option.is_correct == True
        ).first()
 
        if correct_option:
            correct_answers[q.id] = correct_option.id
 
    score = 0
    total = len(data.answers)
 
    for ans in data.answers:
        if correct_answers.get(ans.question_id) == ans.option_id:
            score += 1
 
    percentage = (score / total) * 100 if total > 0 else 0
 
    quiz = db.query(Quiz).filter(Quiz.id == data.quiz_id).first()
 
    is_passed = percentage >= quiz.passing_score
 
    attempt = Attempt(
        user_id=current_user["user_id"],
        quiz_id=data.quiz_id,
        score=int(percentage),
        is_passed=is_passed
    )
 
    db.add(attempt)
    db.commit()
 
    return {
        "score": score,
        "total": total,
        "percentage": percentage,
        "passed": is_passed
    }
 
@router.get("/quiz/attempts/{course_id}")
def get_attempt_status(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    quiz = db.query(Quiz).filter(Quiz.course_id == course_id).first()
 
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
 
    attempt = db.query(Attempt).filter(
        Attempt.user_id == current_user["user_id"],
        Attempt.quiz_id == quiz.id,
        Attempt.is_passed == True
    ).first()
 
    return {
        "passed": True if attempt else False
    }
 
 
@router.post("/generate/{course_id}")
def generate_quiz(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
   
    course = db.query(Course).filter(Course.id == course_id).first()
 
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
 
    existing_quiz = db.query(Quiz).filter(Quiz.course_id == course_id).first()
    if existing_quiz:
        return {
            "message": "Quiz already exists",
            "quiz_id": existing_quiz.id
        }
 
    quiz = Quiz(course_id=course_id, passing_score=60)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
 
    prompt = f"""
    Generate 20 multiple-choice questions.
 
    STRICT RULES:
    - Return ONLY valid JSON
    - No explanation
    - No markdown
    - Each question must have exactly 4 options
    - Only one correct answer
    - correct_answer must be index (0–3)
 
    FORMAT:
    [
        {{
            "question": "...",
            "options": ["...", "...", "...", "..."],
            "correct_answer": 1
        }}
    ]
 
    COURSE:
    Title: {course.title}
    Description: {course.description}
    """
 
    # ✅ GROQ CALL
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
 
        content = response.choices[0].message.content
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
 
    # ✅ CLEAN RESPONSE
    content = re.sub(r"```json|```", "", content).strip()
 
    # ✅ PARSE JSON
    try:
        questions_data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON: {str(e)}")
 
    # ✅ SAVE TO DB
    try:
        for q in questions_data:
            question = Question(
                quiz_id=quiz.id,
                question_text=q["question"]
            )
 
            db.add(question)
            db.commit()
            db.refresh(question)
 
            for idx, opt in enumerate(q["options"]):
                option = Option(
                    question_id=question.id,
                    option_text=opt,
                    is_correct=(idx == q["correct_answer"])
                )
                db.add(option)
 
        db.commit()
 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")
 
    return {
        "message": "Quiz generated successfully ✅",
        "quiz_id": quiz.id
    }
 
 
 
 
@router.get("/quiz/{course_id:int}")
def get_quiz(course_id: int, db: Session = Depends(get_db), current_user=Depends(require_user)):
 
    quiz = db.query(Quiz).filter(Quiz.course_id == course_id).first()
   
    if not quiz:
    # auto generate
        return generate_quiz(course_id, db, current_user)
 
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
 
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
 
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")
 
    random_questions = random.sample(
        questions,
        min(len(questions), 5)
    )
 
    quiz_data = []
 
    for q in random_questions:
 
        options = db.query(Option).filter(
            Option.question_id == q.id
        ).all()
 
        quiz_data.append({
            "question_id": q.id,
            "question": q.question_text,
            "options": [
                {
                    "id": opt.id,
                    "text": opt.option_text
                }
                for opt in options
            ]
        })
 
    return {
        "quiz_id": quiz.id,
        "course_id": course_id,
        "questions": quiz_data
    }
 
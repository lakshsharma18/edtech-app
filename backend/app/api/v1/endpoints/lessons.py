from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lessons import Lesson
from app.models.enrollment import Enrollment
from app.schemas.lessons import LessonCreate
from app.core.security import require_admin, get_current_user

router = APIRouter()


# ✅ CREATE LESSON (ADMIN ONLY)
@router.post("/lessons")
def create_lesson(
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    new_lesson = Lesson(
        title=lesson.title,
        video_url=lesson.video_url,
        notes=lesson.notes,
        course_id=lesson.course_id
    )

    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    return {"message": "Lesson created successfully"}


# ✅ GET LESSONS OF COURSE (ADMIN + ENROLLED USERS)
@router.get("/courses/{course_id}/lessons")
def get_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # ✅ ADMIN BYPASS
    if current_user["role"] == "admin":
        return db.query(Lesson).filter(Lesson.course_id == course_id).all()

    # ✅ CHECK ENROLLMENT
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return db.query(Lesson).filter(Lesson.course_id == course_id).all()


# ✅ GET SINGLE LESSON (ADMIN + ENROLLED USERS)
@router.get("/lessons/{lesson_id}")
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # ✅ ADMIN BYPASS
    if current_user["role"] == "admin":
        return lesson

    # ✅ CHECK ENROLLMENT
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == lesson.course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return lesson
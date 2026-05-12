from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lessons import Lesson
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.schemas.lessons import LessonCreate
from app.core.security import require_admin, get_current_user

router = APIRouter()


# ✅ CREATE LESSON
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


# ✅ GET LESSONS (ADMIN + ENROLLED USERS)
@router.get("/courses/{course_id}/lessons")
def get_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # ✅ ADMIN BYPASS
    if current_user["role"] == "admin":
        return db.query(Lesson).filter(Lesson.course_id == course_id).all()

    # ✅ ENROLLMENT CHECK
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return db.query(Lesson).filter(Lesson.course_id == course_id).all()


# ✅ GET SINGLE LESSON
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

    # ✅ ENROLLMENT CHECK
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == lesson.course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return lesson


# ✅ UPDATE LESSON
@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    existing_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not existing_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    existing_lesson.title = lesson.title
    existing_lesson.video_url = lesson.video_url
    existing_lesson.notes = lesson.notes
    existing_lesson.course_id = lesson.course_id

    db.commit()
    db.refresh(existing_lesson)

    return {"message": "Lesson updated successfully"}


# ✅ DELETE LESSON + AUTO DELETE COURSE
@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = lesson.course_id

    db.delete(lesson)
    db.commit()

    # ✅ CHECK REMAINING LESSONS
    remaining = db.query(Lesson).filter(Lesson.course_id == course_id).count()

    if remaining == 0:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            db.delete(course)
            db.commit()

    return {"message": "Lesson deleted successfully"}
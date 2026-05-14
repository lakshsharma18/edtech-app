from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user
from app.models.lessonprogress import LessonProgress
from app.models.lessons import Lesson
from app.models.enrollment import Enrollment
from app.schemas.progress import MarkComplete

router = APIRouter()

@router.post("/mark-complete")
def mark_complete(
    data: MarkComplete,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    # ✅ lesson exists check
    lesson = db.query(Lesson).filter(Lesson.id == data.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # ✅ enrollment check
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == lesson.course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled")

    # ✅ strict validation (your logic)
    if not (data.watched and data.notes_viewed):
        raise HTTPException(status_code=400, detail="Lesson not fully completed")

    # ✅ check already exists
    existing = db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user["user_id"],
        LessonProgress.lesson_id == data.lesson_id
    ).first()

    if existing:
        return {"message": "Already marked complete"}

    # ✅ create entry
    progress = LessonProgress(
        user_id=current_user["user_id"],
        lesson_id=data.lesson_id,
        completed=True
    )

    db.add(progress)
    db.commit()

    return {"message": "Lesson marked complete"}


@router.get("/progress/{course_id}")
def get_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    # ✅ total lessons
    total = db.query(Lesson).filter(
        Lesson.course_id == course_id
    ).count()

    # ✅ completed lessons
    completed = db.query(LessonProgress).join(Lesson).filter(
        LessonProgress.user_id == current_user["user_id"],
        Lesson.course_id == course_id,
        LessonProgress.completed == True
    ).count()

    if total == 0:
        return {
            "completed": 0,
            "total": 0,
            "progress": 0
        }

    progress = (completed / total) * 100

    return {
        "completed": completed,
        "total": total,
        "progress": round(progress, 2)
    }
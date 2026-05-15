from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lessons import Lesson
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.schemas.lessons import LessonCreate
from app.core.security import require_admin, get_current_user

from app.services.azureservice import upload_file_to_azure

router = APIRouter()


@router.post("/lessons")
def create_lesson(
    title: str = File(...),
    course_id: int = File(...),
    video_file: UploadFile = File(...),
    notes_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    if not video_file.content_type.startswith("video"):
        raise HTTPException(400, "Only video allowed")

    video_url = upload_file_to_azure(video_file)

    pdf_url = None
    if notes_file:
        if notes_file.content_type != "application/pdf":
            raise HTTPException(400, "Only PDF allowed")
        pdf_url = upload_file_to_azure(notes_file)

    lesson = Lesson(
        title=title,
        video_url=video_url,
        notes_url=pdf_url,
        course_id=course_id
    )

    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return {"message": "Lesson created successfully"}

# ✅ GET LESSONS
@router.get("/courses/{course_id}/lessons")
def get_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if current_user["role"] == "admin":
        return db.query(Lesson).filter(Lesson.course_id == course_id).all()

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

    if current_user["role"] == "admin":
        return lesson

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == lesson.course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return lesson


# ✅ UPDATE LESSON (METADATA ONLY — schema-based)
@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    title: str = File(...),
    course_id: int = File(...),

    video_file: UploadFile = File(None),   # ✅ optional
    notes_file: UploadFile = File(None),   # ✅ optional

    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    existing_lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not existing_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # ✅ update basic fields
    existing_lesson.title = title
    existing_lesson.course_id = course_id

    # ✅ update video if provided
    if video_file:
        if not video_file.content_type.startswith("video"):
            raise HTTPException(status_code=400, detail="Only video allowed")

        existing_lesson.video_url = upload_file_to_azure(video_file)

    # ✅ update PDF if provided
    if notes_file:
        if notes_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF allowed")

        existing_lesson.notes_url = upload_file_to_azure(notes_file)

    db.commit()
    db.refresh(existing_lesson)

    return {"message": "Lesson updated successfully"}


# ✅ DELETE LESSON
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

    # ✅ delete course if no lessons left
    remaining = db.query(Lesson).filter(Lesson.course_id == course_id).count()

    if remaining == 0:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            db.delete(course)
            db.commit()

    return {"message": "Lesson deleted successfully"}
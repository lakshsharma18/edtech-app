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


# ✅ CREATE LESSON (VIDEO + PDF UPLOAD)
@router.post("/lessons")
def create_lesson(
    title: str,
    course_id: int,

    video_file: UploadFile = File(...),     # ✅ FIXED
    notes_file: UploadFile = File(None),

    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    # ✅ VIDEO VALIDATION
    if "video" not in video_file.content_type:
        raise HTTPException(status_code=400, detail="Only video files allowed")

    # ✅ upload video
    video_url = upload_file_to_azure(video_file)

    pdf_url = None

    # ✅ upload PDF if provided
    if notes_file:
        if notes_file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF allowed")

        pdf_url = upload_file_to_azure(notes_file)

    new_lesson = Lesson(
        title=title,
        video_url=video_url,
        notes_url=pdf_url,
        course_id=course_id
    )

    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    return {
        "message": "Lesson created successfully",
        "video_url": video_url,
        "notes_url": pdf_url
    }


# ✅ GET LESSONS (NO CHANGE ✅)
@router.get("/courses/{course_id}/lessons")
def get_lessons(course_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    if current_user["role"] == "admin":
        return db.query(Lesson).filter(Lesson.course_id == course_id).all()

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    return db.query(Lesson).filter(Lesson.course_id == course_id).all()


# ✅ GET SINGLE LESSON (NO CHANGE ✅)
@router.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

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


# ✅ UPDATE LESSON (KEEP SIMPLE ✅)
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
    existing_lesson.course_id = lesson.course_id

    db.commit()
    db.refresh(existing_lesson)

    return {"message": "Lesson updated successfully"}


# ✅ DELETE LESSON (NO CHANGE ✅)
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

    remaining = db.query(Lesson).filter(Lesson.course_id == course_id).count()

    if remaining == 0:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            db.delete(course)
            db.commit()

    return {"message": "Lesson deleted successfully"}
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate
from app.core.security import require_admin

router = APIRouter()


# ✅ CREATE COURSE (Only Logged-in User)
@router.post("/courses")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    new_course = Course(
        title=course.title,
        description=course.description,
        price=course.price,
        thumbnail_url=course.thumbnail_url,
        created_by=current_user["user_id"]
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {"message": "Course created successfully"}


# ✅ GET ALL COURSES
@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):

    courses = db.query(Course).all()
    return courses


# ✅ GET SINGLE COURSE
@router.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course
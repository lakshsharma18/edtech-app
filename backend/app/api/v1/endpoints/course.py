from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate
from app.core.security import require_admin

router = APIRouter()


# ✅ CREATE COURSE
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
    return db.query(Course).all()


# ✅ GET SINGLE COURSE
@router.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course


# ✅ UPDATE COURSE
@router.put("/courses/{course_id}")
def update_course(
    course_id: int,
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    existing_course = db.query(Course).filter(Course.id == course_id).first()

    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing_course.title = course.title
    existing_course.description = course.description
    existing_course.price = course.price
    existing_course.thumbnail_url = course.thumbnail_url

    db.commit()
    db.refresh(existing_course)

    return {"message": "Course updated successfully"}


# ✅ DELETE COURSE (CASCADE DELETE LESSONS)
@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully"}
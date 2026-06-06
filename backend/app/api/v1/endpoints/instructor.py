"""
Instructor endpoints for managing their courses and viewing dashboard statistics.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.course import CourseCreate
from app.core.security import require_instructor

router = APIRouter()


# ✅ CREATE NEW COURSE
@router.post("/courses")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Create a new course. Instructor only endpoint.
    """
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


# ✅ GET ALL INSTRUCTOR'S COURSES
@router.get("/instructor/courses")
def get_instructor_courses(
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Get all courses created by the current instructor.
    """
    return db.query(Course).filter(Course.created_by == current_user["user_id"]).all()


# ✅ GET INSTRUCTOR DASHBOARD STATS
@router.get("/instructor/dashboard-stats")
def get_instructor_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Get instructor's dashboard statistics (courses, enrollments, revenue).
    """
    total_courses = db.query(Course).filter(Course.created_by == current_user["user_id"]).count()

    total_enrollments = db.query(Enrollment).join(Course, Enrollment.course_id == Course.id).filter(
        Course.created_by == current_user["user_id"]
    ).count()

    total_revenue = db.query(func.sum(Course.price)).join(
        Enrollment, Enrollment.course_id == Course.id
    ).filter(
        Course.created_by == current_user["user_id"]
    ).scalar() or 0

    return {
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": total_revenue
    }


# ✅ UPDATE INSTRUCTOR'S COURSE
@router.put("/courses/{course_id}")
def update_course(
    course_id: int,
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Update an existing course. Instructor can only update their own courses.
    """
    existing_course = db.query(Course).filter(Course.id == course_id).first()

    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")

    if existing_course.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only update your own course")

    existing_course.title = course.title
    existing_course.description = course.description
    existing_course.price = course.price
    existing_course.thumbnail_url = course.thumbnail_url

    db.commit()
    db.refresh(existing_course)

    return {"message": "Course updated successfully"}

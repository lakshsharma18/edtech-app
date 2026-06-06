"""
Admin endpoints for managing instructors and viewing platform statistics.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment
from app.schemas.user import AdminInstructorCreate
from app.services.authservice import hash_password
from app.core.security import require_admin
from app.services.emailservice import send_instructor_credentials

router = APIRouter()


# ✅ GET ALL INSTRUCTORS WITH STATS
@router.get("/admin/instructors")
def get_admin_instructors(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get all instructors with aggregated statistics.
    Admin only endpoint.
    """
    instructors = db.query(User).filter(User.role == 'instructor').all()

    instructor_rows = []
    total_courses = 0
    total_enrollments = 0
    total_revenue = 0

    for instructor in instructors:
        instructor_courses = db.query(Course).filter(Course.created_by == instructor.id).all()
        instructor_course_count = len(instructor_courses)
        instructor_enrollments = db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.id
        ).filter(
            Course.created_by == instructor.id
        ).count()
        instructor_revenue = db.query(func.sum(Course.price)).join(
            Enrollment, Enrollment.course_id == Course.id
        ).filter(
            Course.created_by == instructor.id
        ).scalar() or 0

        total_courses += instructor_course_count
        total_enrollments += instructor_enrollments
        total_revenue += instructor_revenue

        instructor_rows.append({
            "id": instructor.id,
            "name": f"{instructor.first_name} {instructor.last_name}",
            "email": instructor.email,
            "total_courses": instructor_course_count,
            "total_enrollments": instructor_enrollments,
            "total_revenue": float(instructor_revenue or 0)
        })

    return {
        "total_instructors": len(instructor_rows),
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": float(total_revenue or 0),
        "instructors": instructor_rows
    }


# ✅ REGISTER NEW INSTRUCTOR
@router.post("/admin/instructors")
def create_admin_instructor(
    instructor: AdminInstructorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Register a new instructor. Admin only endpoint.
    Sends credentials email to instructor after registration.
    """
    existing_user = db.query(User).filter(User.email == instructor.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Instructor already registered")

    new_user = User(
        email=instructor.email,
        password=hash_password(instructor.password),
        first_name=instructor.firstName,
        last_name=instructor.lastName,
        role='instructor'
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send credentials email to instructor
    email_sent = send_instructor_credentials(
        to_email=instructor.email,
        first_name=instructor.firstName,
        password=instructor.password
    )

    response_message = "Instructor added successfully"
    if email_sent:
        response_message += " and credentials sent to email"
    else:
        response_message += " but email delivery failed"

    return {"message": response_message}


# ✅ GET INSTRUCTOR'S COURSES WITH STATS
@router.get("/admin/instructors/{instructor_id}/courses")
def get_admin_instructor_courses(
    instructor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get all courses for a specific instructor with enrollment and revenue stats.
    Admin only endpoint.
    """
    instructor = db.query(User).filter(User.id == instructor_id, User.role == 'instructor').first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    courses = db.query(Course).filter(Course.created_by == instructor_id).all()

    instructor_courses = []
    for course in courses:
        enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        instructor_courses.append({
            "id": course.id,
            "title": course.title,
            "price": course.price,
            "enrollments": enrollments,
            "revenue": float(enrollments * course.price)
        })

    return instructor_courses

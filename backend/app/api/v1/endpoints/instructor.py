"""
Instructor endpoints for managing their courses and viewing dashboard statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User  # ✅ Imported User model for roster querying
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


# ✅ GET ALL INSTRUCTOR'S COURSES (Fires on loadDashboardData)
@router.get("/instructor/courses")
def get_instructor_courses(
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Get all courses created by the current instructor.
    """
    return db.query(Course).filter(Course.created_by == current_user["user_id"]).all()


# ✅ GET GLOBAL INSTRUCTOR DASHBOARD STATS (Fills platformStats)
@router.get("/instructor/dashboard-stats")
def get_instructor_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Get instructor's aggregate statistics (total courses, total enrollments, total revenue).
    """
    instructor_id = current_user["user_id"]

    total_courses = db.query(Course).filter(Course.created_by == instructor_id).count()

    total_enrollments = db.query(Enrollment).join(Course, Enrollment.course_id == Course.id).filter(
        Course.created_by == instructor_id
    ).count()

    total_revenue = db.query(func.sum(Course.price)).join(
        Enrollment, Enrollment.course_id == Course.id
    ).filter(
        Course.created_by == instructor_id
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


# ─── 🚀 INJECTED SUB-QUERIES ENFORCED BY YOUR FIXED FRONTEND FILE ───

# ✅ ADDED ROUTE 5: CHOSEN COURSE SPECIFIC STATS (🎯 MATCHES API.get(`/api/v1/instructor/course-stats/${selectedCourseId}`))
@router.get("/instructor/course-stats/{course_id}")
def get_single_course_stats(
    course_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Calculates student counts and revenue for a specific selected course ID.
    Directly feeds into your frontend state variables: setCourseStudentsCount and setCourseRevenue.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Isolation Check: Verifies instructor footprint ownership parameters
    if course.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access Denied: You do not have access to this course.")

    # Calculate student count registered inside this specific module
    total_students = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
    
    # Calculate revenue generated strictly by this targeted course
    course_revenue = total_students * course.price

    return {
        "total_students": total_students,
        "total_revenue": course_revenue
    }


# ✅ ADDED ROUTE 6: CHOSEN COURSE STUDENT ROSTER (🎯 MATCHES API.get(`/api/v1/instructor/course-users/${selectedCourseId}`))
@router.get("/instructor/course-users/{course_id}")
def get_single_course_users(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_instructor)
):
    """
    Fetches the roster of names and emails enrolled in this course.
    Directly maps to your custom frontend dictionary accessor key: usersRes.data?.students
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access Denied: You do not have access to this roster.")

    # Join Users and Enrollments to extract student profiles matching this course_id
    users = db.query(User).join(Enrollment, User.id == Enrollment.user_id).filter(
        Enrollment.course_id == course_id
    ).all()

    student_list = [
        {
            "name": f"{user.first_name} {user.last_name or ''}".strip(),
            "email": user.email
        }
        for user in users
    ]

    # Return key wrapped inside 'students' string block to satisfy: usersRes.data?.students
    return {
        "students": student_list
    }

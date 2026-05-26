from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment
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


#COURSE REVENUE AND STUDENTS PER COURSE 
@router.get("/admin/course-stats/{course_id}")
def get_course_stats(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_students = db.query(Enrollment).filter(
        Enrollment.course_id == course_id
    ).count()

    total_revenue = total_students * course.price

    return {
        "course_id": course.id,
        "course_title": course.title,
        "total_students": total_students,
        "total_revenue": total_revenue
    }

#GET USER FULL NAME,EMAIL ID AND COUNT PER COURSE
@router.get("/admin/course-users/{course_id}")
def get_course_users(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    # ✅ STEP 1: check course
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # ✅ STEP 2: join Enrollment + User
    users = db.query(User).join(Enrollment).filter(
        Enrollment.course_id == course_id
    ).all()

    # ✅ format response
    student_list = [
        {
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email
        }
        for user in users
    ]

    return {
        "course_id": course_id,
        "total_students": len(student_list),
        "students": student_list
    }


#✅ Total users ✅ Total courses ✅ Total enrollments ✅ Total revenue
@router.get("/admin/platform-stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):

    # ✅ total users
    total_users = db.query(User).count()

    # ✅ total courses
    total_courses = db.query(Course).count()

    # ✅ total enrollments
    total_enrollments = db.query(Enrollment).count()

    # ✅ total revenue
    enrollments = db.query(Enrollment).join(Course).all()

    total_revenue = db.query(func.sum(Course.price)).join(Enrollment, Enrollment.course_id == Course.id).scalar() or 0

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": total_revenue
    }
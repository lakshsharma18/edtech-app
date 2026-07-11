from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment  # Added based on your query usage
from app.schemas.course import CourseCreate
from app.core.security import get_current_user
from app.models.rating import CourseRating   # Fixed path prefix

router = APIRouter()


@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    """
    Get all available courses with instructor information.
    Public endpoint - accessible to all users.
    """
    results = (
        db.query(
            Course,
            User.first_name,
            User.last_name,
            func.avg(CourseRating.rating).label("average_rating"),
            func.count(CourseRating.id).label("total_reviews")
        )
        .join(User, Course.created_by == User.id)
        .outerjoin(CourseRating, Course.id == CourseRating.course_id)
        .group_by(Course.id, User.first_name, User.last_name)
        .all()
    )
   
    courses_list = []
    for course, first_name, last_name, avg_rating, total_reviews in results:
        # Avoid using raw __dict__ to protect your code from internal tracking keys (like _sa_instance_state)
        course_data = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "price": course.price,
            "thumbnail_url": course.thumbnail_url,
            "instructor_name": f"{first_name} {last_name}".strip(),
            # Convert decimal rating outputs safely into rounded floats for React math
            "average_rating": round(float(avg_rating), 1) if avg_rating else 0.0,
            "total_reviews": int(total_reviews) if total_reviews else 0
        }
        courses_list.append(course_data)
       
    return courses_list


@router.get("/{course_id}/students")
def get_course_students(
    course_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all students enrolled in a specific course.
    Protected logic: Only the course creator can view the student list.
    """
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.created_by != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only retrieve users for your own course")

    # Fetch and join Enrollment + User tables
    users = db.query(User).join(Enrollment, User.id == Enrollment.user_id).filter(
        Enrollment.course_id == course_id
    ).all()

    # Format output payload
    student_list = [
        {
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email
        }
        for user in users
    ]
    
    return student_list

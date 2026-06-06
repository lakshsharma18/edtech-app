from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment  # Added based on your query usage
from app.schemas.course import CourseCreate   # Fixed path prefix

router = APIRouter()


@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    """
    Get all available courses with instructor information.
    Public endpoint - accessible to all users.
    """
    results = (
        db.query(Course, User.first_name, User.last_name)
        .join(User, Course.created_by == User.id)
        .all()
    )
    
    # Format response to include instructor names cleanly
    courses_list = []
    for course, first_name, last_name in results:
        course_data = course.__dict__.copy()
        course_data["instructor_name"] = f"{first_name} {last_name}"
        courses_list.append(course_data)
        
    return courses_list


@router.get("/{course_id}/students")
def get_course_students(
    course_id: int, 
    db: Session = Depends(get_db),
    # TODO: Add your current_user dependency here, e.g.:
    # current_user: dict = Depends(get_current_user)
):
    """
    Get all students enrolled in a specific course.
    Protected logic: Only the course creator can view the student list.
    """
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verification logic (Ensure current_user dependency is uncommented above to use this)
    # if course.created_by != current_user["user_id"]:
    #     raise HTTPException(status_code=403, detail="You can only retrieve users for your own course")

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

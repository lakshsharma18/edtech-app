from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user,get_current_user
from app.models.enrollment import Enrollment
from app.models.course import Course

router = APIRouter()


# ✅ GET MY COURSES (USER DASHBOARD)
@router.get("/my-courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    # ✅ GET ALL ENROLLMENTS OF USER
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"]
    ).all()

    # ✅ EXTRACT COURSE IDS
    course_ids = [en.course_id for en in enrollments]

    # ✅ FETCH COURSES
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()

    return courses



# ✅ GET CURRENT USER PROFILE
@router.get("/me")
def get_me(current_user = Depends(get_current_user)):

    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "role": current_user["role"]
    }
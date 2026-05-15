from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.schemas.payment import StripeVerify
from app.services.paymentservice import create_checkout_session, verify_session

router = APIRouter()


# ✅ CREATE STRIPE SESSION
@router.post("/create-checkout-session/{course_id}")
def create_checkout(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    session = create_checkout_session(course)

    return {
        "url": session.url
    }



@router.post("/verify-payment")
def verify_payment(
    data: StripeVerify,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    # ✅ VERIFY STRIPE SESSION
    is_paid = verify_session(data.session_id)

    if not is_paid:
        raise HTTPException(status_code=400, detail="Payment not completed")

    # ✅ CHECK COURSE
    course = db.query(Course).filter(Course.id == data.course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # ✅ CHECK DUPLICATE
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == data.course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    # ✅ CREATE ENROLLMENT
    enrollment = Enrollment(
        user_id=current_user["user_id"],
        course_id=data.course_id
    )

    db.add(enrollment)
    db.commit()

    return {
        "message": "Payment successful and enrolled ✅"
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.services.paymentservice import create_order, verify_payment_signature
from app.schemas.enrollment import EnrollmentCreate

router = APIRouter()


# ✅ CREATE PAYMENT ORDER
@router.post("/create-order/{course_id}")
def create_payment_order(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    order = create_order(course.price)

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"]
    }


# ✅ VERIFY PAYMENT + ENROLL USER
@router.post("/verify-payment")
def verify_payment(
    data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):

    # ✅ VERIFY PAYMENT
    verify_data = {
        "razorpay_order_id": data.razorpay_order_id,
        "razorpay_payment_id": data.razorpay_payment_id,
        "razorpay_signature": data.razorpay_signature
    }

    is_valid = verify_payment_signature(verify_data)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")


    # ✅ CHECK COURSE
    course = db.query(Course).filter(Course.id == data.course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")


    # ✅ CHECK ALREADY ENROLLED
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
    db.refresh(enrollment)

    return {
        "message": "Payment successful and enrolled",
        "course_id": data.course_id
    }

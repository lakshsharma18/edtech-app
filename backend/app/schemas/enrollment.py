from pydantic import BaseModel

class EnrollmentCreate(BaseModel):
    course_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
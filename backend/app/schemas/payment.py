from pydantic import BaseModel

class StripeVerify(BaseModel):
    session_id: str
    course_id: int
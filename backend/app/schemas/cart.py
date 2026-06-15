from pydantic import BaseModel

class CartAddRequest(BaseModel):
    course_id: int

class CartItemResponse(BaseModel):
    id: int
    course_id: int
    title: str
    price: float

    class Config:
        from_attributes = True
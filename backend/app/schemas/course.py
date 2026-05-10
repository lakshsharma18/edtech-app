from pydantic import BaseModel

class CourseCreate(BaseModel):
    title: str
    description: str
    price: float
    thumbnail_url: str | None = None
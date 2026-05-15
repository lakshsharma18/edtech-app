from pydantic import BaseModel

class LessonCreate(BaseModel):
    title: str
    course_id: int

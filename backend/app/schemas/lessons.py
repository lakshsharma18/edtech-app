from pydantic import BaseModel

class LessonCreate(BaseModel):
    title: str
    video_url: str
    notes: str | None = None
    course_id: int

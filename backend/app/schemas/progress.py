from pydantic import BaseModel

class MarkComplete(BaseModel):
    lesson_id: int
    watched: bool
    notes_viewed: bool
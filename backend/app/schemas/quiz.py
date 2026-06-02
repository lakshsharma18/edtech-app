from pydantic import BaseModel
from typing import List

class AnswerItem(BaseModel):
    question_id: int
    option_id: int


class SubmitQuiz(BaseModel):
    quiz_id: int
    answers: List[AnswerItem]
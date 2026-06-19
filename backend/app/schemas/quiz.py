from pydantic import BaseModel
from typing import List
<<<<<<< HEAD

class AnswerItem(BaseModel):
    question_id: int
    option_id: int


=======
 
class AnswerItem(BaseModel):
    question_id: int
    option_id: int
 
 
>>>>>>> 97e2e6f750a047fcfd7fb194a942ef4480a9cd05
class SubmitQuiz(BaseModel):
    quiz_id: int
    answers: List[AnswerItem]
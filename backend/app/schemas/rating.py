from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
 
# Payload required from React frontend form submission
class RatingSubmitSchema(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5 stars")
    review_text: Optional[str] = Field(None, max_length=1000)
 
# Structured row output response payload context
class RatingResponseSchema(BaseModel):
    id: int
    user_id: int
    course_id: int
    rating: int
    review_text: Optional[str]
    created_at: datetime
 
    class Config:
        from_attributes = True
 
# Data presentation block for aggregated calculations
class CourseRatingSummarySchema(BaseModel):
    average_rating: float
    total_ratings_count: int
 
 
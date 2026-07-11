from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_user
from app.models.course import Course
from app.models.user import User
from app.models.rating import CourseRating
from app.schemas.rating import RatingSubmitSchema, RatingResponseSchema, CourseRatingSummarySchema
 
router = APIRouter()
 
 
@router.post("/{course_id:int}/rate", response_model=RatingResponseSchema, status_code=status.HTTP_200_OK)
def submit_or_update_course_rating(
    course_id: int,
    payload: RatingSubmitSchema,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    """
    Submits a rating and written text review combined. If the user already reviewed
    this course, it safely updates their existing entry.
    """
    user_id = current_user["user_id"]
 
    # 1. Verify target course context exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
 
    # 2. Check for an existing rating entry from this user on this course
    existing_entry = db.query(CourseRating).filter(
        CourseRating.user_id == user_id,
        CourseRating.course_id == course_id
    ).first()
 
    if existing_entry:
        # Upsert Strategy: Overwrite old feedback structure cleanly
        existing_entry.rating = payload.rating
        existing_entry.review_text = payload.review_text
        db.commit()
        db.refresh(existing_entry)
        return existing_entry
 
    # Create fresh data entry parameters if no record matches
    new_rating = CourseRating(
        user_id=user_id,
        course_id=course_id,
        rating=payload.rating,
        review_text=payload.review_text
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    return new_rating
 
 
@router.get("/{course_id}/rating-summary", response_model=CourseRatingSummarySchema)
def get_course_rating_summary(course_id: int, db: Session = Depends(get_db)):
    """
    Computes aggregate metrics across raw review lines for landing view displays.
    """
    # Verify course existence first
    course_exists = db.query(Course.id).filter(Course.id == course_id).first()
    if not course_exists:
        raise HTTPException(status_code=404, detail="Course not found")
 
    # Compute calculations directly in SQL for speed optimization
    stats = db.query(
        func.avg(CourseRating.rating).label("average"),
        func.count(CourseRating.id).label("count")
    ).filter(CourseRating.course_id == course_id).first()
 
    return {
        "average_rating": round(stats.average or 0.0, 1),
        "total_ratings_count": stats.count or 0
    }
 
@router.get("/{course_id}/reviews", response_model=None)
def get_course_reviews(course_id: int, db: Session = Depends(get_db)):
    """
    Fetches all public ratings and written reviews for a specific course,
    including the first and last name of the reviewer.
    """
    # 1. Verify the course exists
    course_exists = db.query(Course.id).filter(Course.id == course_id).first()
    if not course_exists:
        raise HTTPException(status_code=404, detail="Course not found")
 
    # 2. Query reviews joined with user metadata
    reviews = (
        db.query(CourseRating, User.first_name, User.last_name)
        .join(User, CourseRating.user_id == User.id)
        .filter(CourseRating.course_id == course_id)
        .order_by(CourseRating.created_at.desc()) # Newest reviews first
        .all()
    )
 
    # 3. Format payload for frontend presentation
    formatted_reviews = []
    for review, first_name, last_name in reviews:
        formatted_reviews.append({
            "id": review.id,
            "rating": review.rating,
            "review_text": review.review_text,
            "created_at": review.created_at.strftime("%B %d, %Y"),
            "user_name": f"{first_name} {last_name}".strip()
        })
 
    return formatted_reviews
 
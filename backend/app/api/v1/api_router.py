from fastapi import APIRouter
from app.api.v1.endpoints import auth, course,upload,lessons,payment,mycourse

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(course.router, tags=["Courses"])

api_router.include_router(upload.router, tags=["Upload"])
api_router.include_router(lessons.router, tags=["Lessons"])
api_router.include_router(payment.router, tags=["Payment"])
api_router.include_router(mycourse.router, tags=["MyCourses"])
from fastapi import APIRouter
from app.api.v1.endpoints import auth, course, admin, instructor, lessons, payment, mycourse, progress, chatbot,live

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(course.router,tags=["Course"])
api_router.include_router(admin.router,tags=["Admin"])
api_router.include_router(instructor.router,tags=["Instructor"])
api_router.include_router(live.router,tags=["Live Session"])
api_router.include_router(lessons.router, tags=["Lessons"])
api_router.include_router(payment.router, tags=["Payment"])
api_router.include_router(mycourse.router, tags=["MyCourses"])
api_router.include_router(progress.router, tags=["Progress"])
api_router.include_router(chatbot.router, tags=["AI Chatbot"])

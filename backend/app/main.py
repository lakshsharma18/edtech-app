from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api_router import api_router
from app.core.database import Base, engine

# ✅ IMPORTANT: load models
from app.models import user, course, lessons,enrollment,lessonprogress

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ create tables
Base.metadata.create_all(bind=engine)

# ✅ include routes
app.include_router(api_router, prefix="/api/v1")
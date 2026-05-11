from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api_router import api_router
from app.core.database import Base, engine
from app.models.user import User
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Include routes
app.include_router(api_router, prefix="/api/v1")
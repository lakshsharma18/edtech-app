from fastapi import FastAPI
from app.api.v1.api_router import api_router
from app.core.database import Base, engine
from app.models.user import User
app = FastAPI()

# ✅ Create tables
Base.metadata.create_all(bind=engine)

# ✅ Include routes
app.include_router(api_router, prefix="/api/v1")
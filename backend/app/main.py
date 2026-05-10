from fastapi import FastAPI
from app.api.v1.api_router import api_router
from app.core.database import Base, engine

# ✅ IMPORTANT: load models
from app.models import user, course

app = FastAPI()

# ✅ create tables
Base.metadata.create_all(bind=engine)

# ✅ include routes
app.include_router(api_router, prefix="/api/v1")
from fastapi import APIRouter, Depends, UploadFile, File
from app.services.azureservice import upload_video_to_azure
from app.core.security import require_admin
router = APIRouter()

@router.post("/upload-video")
def upload_video(file: UploadFile = File(...),
                current_user = Depends(require_admin)):

    video_url = upload_video_to_azure(file)

    return {
        "video_url": video_url
    }
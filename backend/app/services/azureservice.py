from azure.storage.blob import BlobServiceClient, ContentSettings
from app.core.config import AZURE_STORAGE_CONNECTION_STRING, AZURE_CONTAINER_NAME
import uuid

blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_STORAGE_CONNECTION_STRING
)

def upload_video_to_azure(file):

    # ✅ unique filename (prevents overwrite)
    filename = f"{uuid.uuid4()}_{file.filename}"

    blob_client = blob_service_client.get_blob_client(
        container=AZURE_CONTAINER_NAME,
        blob=filename
    )

    # ✅ FIX: set correct content type (VERY IMPORTANT)
    content_settings = ContentSettings(
        content_type=file.content_type
    )

    # ✅ upload file with content settings
    blob_client.upload_blob(
        file.file,
        overwrite=True,
        content_settings=content_settings
    )

    # ✅ return public URL
    return blob_client.url
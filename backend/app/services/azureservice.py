from azure.storage.blob import BlobServiceClient, ContentSettings
from app.core.config import AZURE_STORAGE_CONNECTION_STRING, AZURE_CONTAINER_NAME
import uuid

# ✅ Initialize Azure Blob Service
blob_service_client = BlobServiceClient.from_connection_string(
    AZURE_STORAGE_CONNECTION_STRING
)


# ✅ GENERIC FILE UPLOAD (VIDEO + PDF + IMAGE)
def upload_file_to_azure(file):

    # ✅ Create unique filename (avoid overwrite)
    filename = f"{uuid.uuid4()}_{file.filename}"

    blob_client = blob_service_client.get_blob_client(
        container=AZURE_CONTAINER_NAME,
        blob=filename
    )

    # ✅ Ensure correct content type is set
    content_settings = ContentSettings(
        content_type=file.content_type  # auto handles video/pdf/image
    )

    # ✅ Upload file to Azure
    blob_client.upload_blob(
        file.file,
        overwrite=True,
        content_settings=content_settings
    )

    # ✅ Return public URL
    return blob_client.url
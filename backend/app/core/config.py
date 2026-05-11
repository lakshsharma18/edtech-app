from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

password = quote_plus('12345')
DATABASE_URL = f"postgresql://postgres:{password}@localhost:5432/edtech-app"

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")


RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

password = quote_plus('Kush@2004')
DATABASE_URL = f"postgresql://postgres:{password}@localhost:5432/edtech-app"

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")


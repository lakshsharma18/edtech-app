from urllib.parse import quote_plus
password = quote_plus('12345')
DATABASE_URL = f"postgresql://postgres:{password}@localhost:5432/edtech-app"
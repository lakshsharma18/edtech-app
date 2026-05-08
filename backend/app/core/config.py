from urllib.parse import quote_plus
password = quote_plus('Kush@2004')
DATABASE_URL = f"postgresql://postgres:{password}@localhost:5432/edtech-app"
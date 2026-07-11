# 📂 File: backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db

# Establish an isolated SQLite database entirely in RAM memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, 
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 🎯 THE INVISIBLE DATA SCRUBBER LOOPS:
# This runs before table generation to safely translate Postgres raw text('now()')
# into SQLite standard CURRENT_TIMESTAMP dynamically, leaving your real model files untouched!
for table in Base.metadata.tables.values():
    for column in table.columns:
        if column.server_default and hasattr(column.server_default, 'arg'):
            if isinstance(column.server_default.arg, type(text(''))):
                text_clause_string = str(column.server_default.arg.text).lower()
                if text_clause_string == 'now()':
                    column.server_default.arg = text('CURRENT_TIMESTAMP')

# PyTest Fixture: Builds the database infrastructure on boot, and tears it down after tests finish
@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# PyTest Fixture: Generates a temporary isolated database session query pipeline
@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

# PyTest Fixture: Creates a fake API client to fire HTTP network requests down FastAPI
@pytest.fixture(scope="function")
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

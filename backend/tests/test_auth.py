# 📂 File: backend/tests/test_auth.py
from app.models.user import User
from app.services.authservice import hash_password

def test_instructor_first_login_flag(client, db_session):
    """
    🎯 EXPECTATION: A newly created instructor row must return
    is_first_login: true inside the login API payload dictionary.
    """
    # 1. Seed a fake newly-registered Instructor straight into our RAM sandbox database
    secure_hash = hash_password("temp_password123")
    fake_instructor = User(
        email="instructor@academy.com",
        password=secure_hash,
        first_name="Kush",
        last_name="Instructor",
        role="instructor",
        is_first_login=True # Set gate active
    )
    db_session.add(fake_instructor)
    db_session.commit()

    # 2. Fire a mock HTTP POST request down your real /login route configuration
    login_payload = {"email": "instructor@academy.com", "password": "temp_password123"}
    response = client.post("/api/v1/auth/login", json=login_payload)

    # 3. ASSERT: Assert status codes are 200 OK and parameters match exactly
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "instructor"
    assert data["is_first_login"] is True  # ✅ Verifies your instructor isolation guard works!

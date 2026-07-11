# 📂 File: backend/tests/test_cart.py
from app.models.user import User
from app.models.course import Course
from app.core.security import create_access_token

def test_prevent_duplicate_cart_additions(client, db_session):
    """
    🎯 EXPECTATION: Calling /cart/add a second time for the same course
    must be rejected with a 400 Bad Request error.
    """
    # 1. Seed a fake user student profile and a fake course item into playground memory
    student = User(email="student@email.com", password="hash", first_name="Laksh", last_name="S", role="user")
    course = Course(title="FastAPI Essentials", description="Core backend track", price=499.0, created_by=1)
    db_session.add(student)
    db_session.add(course)
    db_session.commit()

    # 2. Generate a valid mock JWT token authorization header passport string to authorize the request
    token = create_access_token({"user_id": student.id, "email": student.email, "first_name": student.first_name, "role": student.role})
    auth_headers = {"Authorization": f"Bearer {token}"}

    cart_payload = {"course_id": course.id}

    # 3. Hit the add endpoint the First time -> Expect 200 Success
    first_response = client.post("/api/v1/cart/add", json=cart_payload, headers=auth_headers)
    assert first_response.status_code == 200

    # 4. Hit the exact same endpoint the Second time -> Expect 400 Bad Request Failure
    second_response = client.post("/api/v1/cart/add", json=cart_payload, headers=auth_headers)
    
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Course is already in your cart"
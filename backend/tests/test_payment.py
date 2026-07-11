# 📂 File: backend/tests/test_payment.py
from unittest.mock import patch, MagicMock
from app.models.user import User
from app.models.course import Course
from app.models.cart import CartItem
from app.models.enrollment import Enrollment
from app.models.paymentrecords import PaymentRecord
from app.core.security import create_access_token

@patch("stripe.checkout.Session.retrieve")
def test_bulk_checkout_enrollment_and_cart_flush(mock_stripe_retrieve, client, db_session):
    """
    1. Enroll the student in ALL courses.
    2. Create individual unique payment logs.
    3. Completely clear out the user's cart_items table rows.
    """
    # 1. Seed a Student, 2 Courses, and link them inside the CartItem table
    student = User(email="buyer@email.com", password="hash", first_name="Kush", last_name="L", role="user")
    course1 = Course(title="React Core", description="Frontend Track", price=500.0, created_by=1)
    course2 = Course(title="FastAPI Advanced", description="Backend Track", price=300.0, created_by=1)
    db_session.add_all([student, course1, course2])
    db_session.commit()

    cart1 = CartItem(user_id=student.id, course_id=course1.id)
    cart2 = CartItem(user_id=student.id, course_id=course2.id)
    db_session.add_all([cart1, cart2])
    db_session.commit()

    # 2. Mock the Stripe API return payload containing the course IDs inside metadata attributes
    mock_session = MagicMock()
    mock_session.payment_status = "paid"
    
    # Simulate our exact StripeObject structure to prevent AttributeError or KeyError crashes
    mock_metadata = MagicMock()
    mock_metadata.course_ids = f"{course1.id},{course2.id}"
    mock_session.metadata = mock_metadata
    
    mock_stripe_retrieve.return_value = mock_session

    # 3. Fire payment verification request using a valid student JWT token header passport
    token = create_access_token({"user_id": student.id, "email": student.email, "first_name": student.first_name, "role": student.role})
    headers = {"Authorization": f"Bearer {token}"}
    
    verify_payload = {"session_id": "cs_test_mock_123", "course_id": 0}
    response = client.post("/api/v1/verify-payment", json=verify_payload, headers=headers)

    assert response.status_code == 200

    # 4. CRITICAL BULK FLOW ASSERTIONS:
    # Check that individual enrollments were written for BOTH items
    enrollments = db_session.query(Enrollment).filter(Enrollment.user_id == student.id).all()
    assert len(enrollments) == 2
    
    # Check that individual payment records wrote successfully with the uniqueness suffix
    payment_logs = db_session.query(PaymentRecord).filter(PaymentRecord.user_id == student.id).all()
    assert len(payment_logs) == 2

    # Check that the database cart table was automatically wiped clean for this user
    remaining_cart_items = db_session.query(CartItem).filter(CartItem.user_id == student.id).count()
    assert remaining_cart_items == 0  # Database cart wiped completely!

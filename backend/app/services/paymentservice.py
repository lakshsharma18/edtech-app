import stripe
from app.core.config import STRIPE_SECRET_KEY

# Set Stripe API key from your core config file securely
stripe.api_key = STRIPE_SECRET_KEY


# ✅ CREATE CHECKOUT SESSION (For single course quick-buy paths)
def create_checkout_session(course):
    """
    Creates a basic single-item checkout session wrapper for fallback quick buys.
    """
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": course.title
                    },
                    "unit_amount": int(course.price * 100), # Stripe expects integer paise/cents
                },
                "quantity": 1,
            }
        ],
        success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="http://localhost:5173/cancel",
    )
    return session


# ✅ VERIFY STRIPE SESSION PAYMENTS
def verify_session(session_id: str):
    """
    Reaches out directly to Stripe's secure API servers to verify 
    if the transaction session ID status is marked as 'paid'.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return session.payment_status == "paid"
    except Exception as e:
        print(f"Stripe communication lookup failed: {e}")
        return False
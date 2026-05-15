import stripe
from app.core.config import STRIPE_SECRET_KEY

stripe.api_key = STRIPE_SECRET_KEY


# ✅ CREATE CHECKOUT SESSION
def create_checkout_session(course):

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
                    "unit_amount": int(course.price * 100),
                },
                "quantity": 1,
            }
        ],

        success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url="http://localhost:5173/cancel",
    )

    return session


# ✅ VERIFY SESSION
def verify_session(session_id: str):

    session = stripe.checkout.Session.retrieve(session_id)

    return session.payment_status == "paid"
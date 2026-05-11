import razorpay
from app.core.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# ✅ Create Razorpay client (connects backend to Razorpay)
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ✅ CREATE ORDER (used before payment)
def create_order(amount: int):
    order = client.order.create({
        "amount": amount * 100, 
        "currency": "INR",
        "payment_capture": 1
    })

    return order


# ✅ VERIFY PAYMENT (used after payment)
def verify_payment_signature(data: dict):
    try:
        client.utility.verify_payment_signature(data)
        return True
    except:
        return False
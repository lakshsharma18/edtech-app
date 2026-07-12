import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.paymentservice import create_checkout_session
from app.core.database import get_db
from app.core.security import require_user
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.paymentrecords import PaymentRecord  
from app.models.cart import CartItem  
from app.schemas.payment import StripeVerify
from app.core.config import STRIPE_SECRET_KEY

router = APIRouter()

stripe.api_key = STRIPE_SECRET_KEY
# 💾 ITEMIZED EMAIL DISPATCHER INTERNAL HELPER
def send_receipt_email(to_email: str, student_name: str, items_list: list, total_amount: float, transaction_id: str):
    """
    Connects to the Gmail SMTP server using the secure STARTTLS protocol over Port 587.
    Injects multiple transactional metadata rows dynamically into an HTML layout grid.
    """
    msg = MIMEMultipart()
    msg['From'] = "koshtakush@gmail.com"
    msg['To'] = to_email
    msg['Subject'] = "📄 Order Confirmation: Payment Receipt"

    # Compile the dynamic HTML rows for every item purchased in the cart bundle
    table_rows_html = ""
    for item in items_list:
        table_rows_html += f"""
        <tr>
            <td style="padding: 12px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">{item['title']}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color: #10b981; border-bottom: 1px solid #e2e8f0;">₹{item['price']:,.2f}</td>
        </tr>
        """

    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 25px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <h2 style="color: #0dcaf0; margin: 0 0 5px 0; font-weight: 800;">ED-TECH ACADEMY</h2>
                <p style="color: #64748b; margin: 0; font-size: 0.85rem;">Official Payment Confirmation Statement</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
                
                <p style="font-size: 0.95rem; color: #334155;">Hello <strong>{student_name}</strong>,</p>
                <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">Thank you for your purchase! Your payment was processed successfully. Permanent course access has been added to your student workspace.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 0.9rem;">
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 10px 12px; text-align: left; color: #475569; border-bottom: 1px solid #e2e8f0;">Course Item</th>
                        <th style="padding: 10px 12px; text-align: right; color: #475569; border-bottom: 1px solid #e2e8f0;">Price Paid</th>
                    </tr>
                    {table_rows_html}
                    <tr style="background-color: #f8fafc;">
                        <td style="padding: 12px; font-weight: bold; color: #1e293b;">Total Amount:</td>
                        <td style="padding: 12px; text-align: right; font-weight: 800; color: #2563eb; font-size: 1.05rem;">₹{total_amount:,.2f}</td>
                    </tr>
                </table>

                <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 4px 0;"><strong>Receipt ID:</strong> {transaction_id}</p>
                <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;"><strong>Date Issued:</strong> {datetime.utcnow().strftime('%d %B %Y')}</p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
                <p style="font-size: 0.75rem; color: #94a3b8; text-align: center; margin: 0;">This is an automatically generated transaction document. Do not reply directly.</p>
            </div>
        </body>
    </html>
    """
    msg.attach(MIMEText(html_body, 'html'))
    try:
        with smtplib.SMTP("://gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login("koshtakush@gmail.com", "pcqdhpakdstgqqod")
            smtp.send_message(msg)
    except Exception as e:
        print(f"Failed to dispatch transaction receipt email: {e}")


def log_payment_record(db: Session, intent_id: str, user_id: int, course_id: int, amount: float):
    already_saved = db.query(PaymentRecord).filter(
        PaymentRecord.stripe_intent_id == intent_id
    ).first()
    
    if not already_saved:
        new_record = PaymentRecord(
            stripe_intent_id=intent_id,
            user_id=user_id,
            course_id=course_id,
            amount_paid=amount,
            status="succeeded"
        )
        db.add(new_record)
        db.flush()

# ✅ CREATE SINGLE CHECKOUT SESSION (UNTOUCHED BACKWARDS COMPATIBILITY)
@router.post("/create-checkout-session/{course_id}")
def create_checkout(course_id: int, db: Session = Depends(get_db), current_user = Depends(require_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    session = create_checkout_session(course)
    return {"url": session.url}


# ✅ BULK STRIPE CART SESSION LAUNCHER WITH METADATA COLLAPSE
@router.post("/create-cart-checkout-session")
def create_cart_checkout_session(db: Session = Depends(get_db), current_user = Depends(require_user)):
    """
    Fetches all items in the user's cart, packages them into a single Stripe line item 
    for clean total view layout display, and passes comma-separated IDs inside metadata.
    """
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user["user_id"]).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Your shopping cart is empty.")

    titles_list = []
    course_ids_list = []
    total_bill = 0.0
    
    for item in cart_items:
        course = db.query(Course).filter(Course.id == item.course_id).first()
        if course:
            titles_list.append(course.title)
            course_ids_list.append(str(course.id))
            total_bill += float(course.price)

    master_display_title = " , ".join(titles_list)
    if len(master_display_title) > 200:
        master_display_title = f"Course Bundle ({len(titles_list)} Modules Package)"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': master_display_title,
                    },
                    'unit_amount': int(total_bill * 100), 
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url="https://edtech-app-8rp.pages.dev/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://edtech-app-8rp.pages.dev/cancel",
            client_reference_id=str(current_user["user_id"]),
            metadata={
                "course_ids": ",".join(course_ids_list)
            }
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe setup failed: {str(e)}")

# ✅ VERIFY PAYMENT (FULLY RECTIFIED AND SECURED ROUTE BLOCK)
@router.post("/verify-payment")
def verify_payment(
    data: StripeVerify, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_user)
):

    try:
        # 📡 Retrieve full checkout session details from Stripe's live API servers
        session = stripe.checkout.Session.retrieve(data.session_id)
        is_paid = session.payment_status == "paid"
    except Exception as e:
        print(f"Stripe retrieval failed: {e}")
        raise HTTPException(status_code=400, detail="Stripe session query transaction failed.")

    if not is_paid:
        raise HTTPException(status_code=400, detail="Payment not completed")

    user_id = int(current_user["user_id"])
    mock_intent_id = f"rcpt_{str(data.session_id[-12:])}"
    
    purchased_items_receipt_log = []
    total_bill_amount = 0.0


    # Safely extract the string from the Stripe object without forcing a dict() type cast.
    metadata_ids_string = None
    if hasattr(session, "metadata") and session.metadata is not None:
        if hasattr(session.metadata, "course_ids"):
            metadata_ids_string = session.metadata.course_ids

    if metadata_ids_string:
        # 🎯 CASE A: THE BULK BUNDLE CHECKOUT TRANSACTION PROCESSING PIPELINE
        # Parse the comma-separated string back into a clean list of individual integers
        target_course_ids = [int(cid) for cid in metadata_ids_string.split(",") if cid.strip()]
        
        for cid in target_course_ids:
            course = db.query(Course).filter(Course.id == cid).first()
            if not course:
                continue
                
            # Prevent duplicate enrollment exceptions from breaking execution
            existing = db.query(Enrollment).filter(
                Enrollment.user_id == user_id, 
                Enrollment.course_id == course.id
            ).first()
            
            if not existing:
                enrollment = Enrollment(user_id=user_id, course_id=course.id)
                db.add(enrollment)
            
            # Appends the explicit course ID suffix to create an absolutely unique identifier
            unique_bundle_intent_id = f"{mock_intent_id}_{course.id}"
            course_price_float = float(course.price or 0.0)

            log_payment_record(
                db=db,
                intent_id=unique_bundle_intent_id, 
                user_id=user_id, 
                course_id=int(course.id), 
                amount=course_price_float
            )
            purchased_items_receipt_log.append({"title": str(course.title), "price": course_price_float})
            total_bill_amount += course_price_float
            
        # ✅ CLEAR THE CART FLOW: Wipe out their database cart table items upon checkout victory!
        db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        
    else:
        # 🎯 CASE B: THE SINGLE COURSE QUICK-BUY FALLBACK PIPELINE
        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
            
        existing = db.query(Enrollment).filter(
            Enrollment.user_id == user_id, 
            Enrollment.course_id == data.course_id
        ).first()
        
        if not existing:
            enrollment = Enrollment(user_id=user_id, course_id=data.course_id)
            db.add(enrollment)
            
        course_price_float = float(course.price or 0.0)
        log_payment_record(db, mock_intent_id, user_id, data.course_id, course_price_float)
        purchased_items_receipt_log.append({"title": str(course.title), "price": course_price_float})
        total_bill_amount = course_price_float

    db.commit()  # Atomically saves all enrollments, payment logs, and cart deletions

    # Dispatch unified email invoice
    send_receipt_email(
        to_email=str(current_user["email"]),
        student_name=str(current_user["first_name"]),
        items_list=purchased_items_receipt_log,
        total_amount=total_bill_amount,
        transaction_id=mock_intent_id
    )
    
    return {"message": "Payment verified and processed successfully ✅"}




# ✅ GET USER PERSONAL TRANSACTION HISTORY LIST (UNTOUCHED)
@router.get("/my-payments-history")
def get_user_payments_history(db: Session = Depends(get_db), current_user = Depends(require_user)):
    """
    Queries the ledger table rows filtering strictly by active logged-in student parameters.
    Maps out transaction values array to paint the frontend data tables.
    """
    records = db.query(PaymentRecord).filter(
        PaymentRecord.user_id == current_user["user_id"],
        PaymentRecord.status == "succeeded"
    ).order_by(PaymentRecord.created_at.desc()).all()

    return [
        {
            "receipt_id": r.stripe_intent_id,
            "course_title": r.course.title,
            "amount": r.amount_paid,
            "date": r.created_at.strftime("%d %B %Y"),
            "status": r.status
        }
        for r in records
    ]

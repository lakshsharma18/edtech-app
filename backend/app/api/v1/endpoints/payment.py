import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_user
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.paymentrecords import PaymentRecord  # ✅ IMPORT THE LEDGER MODEL
from app.schemas.payment import StripeVerify
from app.services.paymentservice import create_checkout_session, verify_session

router = APIRouter()


# 💾 GMAIL RECEIPT DISPATCHER INTERNAL HELPER
def send_receipt_email(to_email: str, student_name: str, course_title: str, amount: float, transaction_id: str):
    """
    Connects to Gmail SMTP server using secure STARTTLS protocol over Port 587.
    Injects transactional metadata into a responsive HTML layout grid.
    """
    msg = MIMEMultipart()
    msg['From'] = "koshtakush@gmail.com"
    msg['To'] = to_email
    msg['Subject'] = f"📄 Payment Receipt: {course_title}"

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
                    <tr>
                        <td style="padding: 12px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">{course_title}</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700; color: #10b981; border-bottom: 1px solid #e2e8f0;">₹{amount:,.2f}</td>
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
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login("koshtakush@gmail.com", "pcqdhpakdstgqqod")
            smtp.send_message(msg)
    except Exception as e:
        print(f"Failed to dispatch transaction receipt email: {e}")


# 🗄️ INTERNAL LEDGER DATABASE LOGGER HELPER
def log_payment_record(db: Session, intent_id: str, user_id: int, course_id: int, amount: float):

    already_saved = db.query(PaymentRecord).filter(PaymentRecord.stripe_intent_id == intent_id).first()
    
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


# ✅ CREATE STRIPE SESSION (ORIGINAL UNTOUCHED)
@router.post("/create-checkout-session/{course_id}")
def create_checkout(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    session = create_checkout_session(course)

    return {
        "url": session.url
    }


# ✅ VERIFY PAYMENT (ORIGINAL DESIGN - UPDATED INTERNALLY TO INVOKE BACKGROUND JOBS)
@router.post("/verify-payment")
def verify_payment(
    data: StripeVerify,
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):
    # ✅ VERIFY STRIPE SESSION
    is_paid = verify_session(data.session_id)

    if not is_paid:
        raise HTTPException(status_code=400, detail="Payment not completed")

    # ✅ CHECK COURSE
    course = db.query(Course).filter(Course.id == data.course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # ✅ CHECK DUPLICATE
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["user_id"],
        Enrollment.course_id == data.course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    # ✅ CREATE ENROLLMENT
    enrollment = Enrollment(
        user_id=current_user["user_id"],
        course_id=data.course_id
    )

    db.add(enrollment)
    
    mock_intent_id = f"rcpt_{data.session_id[-12:]}"
    user_id = current_user["user_id"]
    
    log_payment_record(db, mock_intent_id, user_id, data.course_id, course.price)
    
    db.commit()  # Commits both enrollment tracks and transaction logs simultaneously

    # 2️⃣ Fires your verified Gmail credentials to send the student their receipt
    student_name = current_user["first_name"]

    user_email = current_user["email"]

    send_receipt_email(
        to_email=user_email,
        student_name=student_name,
        course_title=course.title,
        amount=course.price,
        transaction_id=mock_intent_id
    )
    return {
        "message": "Payment successful and enrolled ✅"
    }


# ✅ NEW ACTION ENDPOINT: USER PERSONAL TRANSACTION VIEW HISTORY LIST
@router.get("/my-payments-history")
def get_user_payments_history(
    db: Session = Depends(get_db),
    current_user = Depends(require_user)
):
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

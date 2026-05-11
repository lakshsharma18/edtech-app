import smtplib
from email.mime.text import MIMEText

EMAIL = "koshtakush@gmail.com"
PASSWORD = "pcqdhpakdstgqqod"  # NOT normal gmail password


def send_otp_email(to_email: str, otp: str):
    subject = "Your OTP Code"
    body = f"Your OTP is: {otp}"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to_email

    # with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
    #     smtp.login(EMAIL, PASSWORD)
    #     smtp.send_message(msg)
    try:
        # Use Port 587 with STARTTLS for better compatibility
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()  # Secure the connection
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)
            return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
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

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL, PASSWORD)
        smtp.send_message(msg)
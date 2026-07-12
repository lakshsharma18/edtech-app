import os
import smtplib
import traceback
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")

# Ensure credentials exist
if not EMAIL or not PASSWORD:
    raise ValueError(
        "EMAIL or EMAIL_PASSWORD environment variables are not set."
    )


def send_otp_email(to_email: str, otp: str):
    """Send OTP email."""

    subject = "Your OTP Code"
    body = f"Your OTP is: {otp}"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)

        print(f"OTP email sent successfully to {to_email}")
        return True

    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        traceback.print_exc()
        return False


def send_instructor_credentials(to_email: str, first_name: str, password: str):
    """Send instructor credentials via HTML email."""

    subject = "Your ED-TECH Instructor Account Credentials"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
            }}

            .container {{
                max-width: 600px;
                margin: auto;
                padding: 20px;
            }}

            .header {{
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                text-align: center;
                padding: 30px;
                border-radius: 8px 8px 0 0;
            }}

            .content {{
                background: #f8fafc;
                padding: 30px;
                border: 1px solid #e2e8f0;
                border-radius: 0 0 8px 8px;
            }}

            .credentials-box {{
                background: white;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 20px 0;
            }}

            .credential-row {{
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }}

            .credential-row:last-child {{
                border-bottom: none;
            }}

            .label {{
                font-weight: bold;
                color: #64748b;
            }}

            .button {{
                display: inline-block;
                background: #2563eb;
                color: white !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                margin-top: 20px;
            }}

            .footer {{
                margin-top: 30px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
            }}
        </style>
    </head>

    <body>

        <div class="container">

            <div class="header">
                <h1>Welcome to ED-TECH</h1>
            </div>

            <div class="content">

                <h2>Hello {first_name},</h2>

                <p>
                    Your instructor account has been successfully created.
                    Please use the credentials below to log in.
                </p>

                <div class="credentials-box">

                    <div class="credential-row">
                        <span class="label">Email:</span><br>
                        {to_email}
                    </div>

                    <div class="credential-row">
                        <span class="label">Password:</span><br>
                        {password}
                    </div>

                </div>

                <p>
                    Please change your password after your first login.
                </p>

                <a
                    href="https://edtech-app-8rp.pages.dev/login"
                    class="button"
                >
                    Login to ED-TECH
                </a>

                <div class="footer">
                    © 2026 ED-TECH
                </div>

            </div>

        </div>

    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")

    msg["Subject"] = subject
    msg["From"] = EMAIL
    msg["To"] = to_email

    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)

        print(f"Instructor credentials email sent successfully to {to_email}")
        return True

    except Exception as e:
        print(f"Failed to send instructor credentials email: {e}")
        traceback.print_exc()
        return False
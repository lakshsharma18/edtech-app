import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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


def send_instructor_credentials(to_email: str, first_name: str, password: str):
    """Send instructor credentials via email with HTML formatting."""
    subject = "Your ED-TECH Instructor Account Credentials"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }}
            .welcome {{ font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .credentials-box {{ background: white; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px; }}
            .credential-row {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }}
            .credential-row:last-child {{ border-bottom: none; }}
            .label {{ font-weight: 600; color: #64748b; }}
            .value {{ color: #1e293b; word-break: break-all; }}
            .info-text {{ color: #64748b; font-size: 14px; margin: 20px 0; }}
            .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }}
            .logo {{ font-size: 24px; font-weight: bold; margin: 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <p class="logo">ED<span style="color: #60a5fa;">-</span>TECH</p>
                <h1>Welcome to Instructor Portal</h1>
            </div>
            <div class="content">
                <p class="welcome">Hi {first_name},</p>
                <p>Welcome to the ED-TECH instructor community! Your account has been successfully created. Use the credentials below to log in and start creating amazing courses.</p>
                
                <div class="credentials-box">
                    <div class="credential-row">
                        <span class="label">Email:</span>
                        <span class="value">{to_email}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">Password:</span>
                        <span class="value">{password}</span>
                    </div>
                </div>
                
                <p class="info-text">🔒 <strong>Security Reminder:</strong> Keep your credentials secure. Do not share your password with anyone. You can change your password anytime after logging in.</p>
                
                <a href="http://127.0.0.1:5173/login" class="button">Login to Your Account</a>
                
                <div class="footer">
                    <p>© 2026 ED-TECH. All rights reserved.</p>
                    <p>If you didn't create this account, please contact support immediately.</p>
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
            smtp.starttls()
            smtp.login(EMAIL, PASSWORD)
            smtp.send_message(msg)
            return True
    except Exception as e:
        print(f"Failed to send instructor credentials email: {e}")
        return False

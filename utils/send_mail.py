import os
import secrets
from imhotep_mail import send_mail
from config import Config
from flask import session

# define the mail to send the verification code and the forget password
# app.config['MAIL_SERVER']='smtp.gmail.com'
# app.config['MAIL_PORT'] = 465
# app.config['MAIL_USERNAME'] = 'imhotepfinance@gmail.com'
# app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
# app.config['MAIL_USE_TLS'] = False
# app.config['MAIL_USE_SSL'] = True
# mail = Mail(app)

smtp_server = 'smtp.gmail.com'
smtp_port = 465
email_send = 'imhotepfinance@gmail.com'
email_send_password = os.getenv('MAIL_PASSWORD')

def send_verification_mail_code(user_mail):
    verification_code = secrets.token_hex(4)
    is_html = True
    body = f"""
    <h3>Email Verification</h3>
    <p>Dear User,</p>
    <p>Thank you for registering with Imhotep Financial Manager. To complete your registration, please use the following verification code:</p>
    <h1>{verification_code}</h1>
    <p>Please enter this code in the verification page to activate your account.</p>
    <p>If you did not request this email, please ignore it.</p>
    <p>Best regards,</p>
    <p>The Imhotep Financial Manager Team</p>
    """
    success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Email Verification", body, is_html)
    if error:
        print(error)

    session["verification_code"] = verification_code
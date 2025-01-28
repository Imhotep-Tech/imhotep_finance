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
    body = f"<h3>Your verification code is:</h3> <h1>{verification_code}</h1>"
    success, error = send_mail(smtp_server , smtp_port , email_send , email_send_password , user_mail, "Email Verification" ,body, is_html)
    if error:
        print(error)
        Config.logger.error("This is an error message.")

    session["verification_code"] = verification_code
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
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Imhotep Financial Manager</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    📧 Email Verification Required
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                    Imhotep Financial Manager Registration
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #155724; margin-top: 0; font-size: 18px;">🎉 Welcome to Imhotep Financial Manager!</h3>
                    <p style="margin-bottom: 0; color: #155724;">
                        Thank you for registering. You're just one step away from accessing your personal financial dashboard.
                    </p>
                </div>
                
                <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                    Verify Your Email Address
                </h2>
                
                <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                    Dear New User,
                </p>
                
                <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                    To complete your registration and activate your Imhotep Financial Manager account, please use the verification code below:
                </p>
                
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #51adac; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                    <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                    <h1 style="color: #51adac; font-family: 'Courier New', monospace; font-size: 32px; margin: 0; letter-spacing: 3px; font-weight: bold;">
                        {verification_code}
                    </h1>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://imhotepf.pythonanywhere.com/login_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                        ✅ Complete Verification
                    </a>
                </div>
                
                <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #0c5460; margin-top: 0;">🚀 What's Next?</h4>
                    <ul style="color: #0c5460; padding-left: 20px; margin-bottom: 0;">
                        <li style="margin-bottom: 8px;">Enter the verification code on the registration page</li>
                        <li style="margin-bottom: 8px;">Set up your financial goals and preferences</li>
                        <li style="margin-bottom: 8px;">Start tracking your income and expenses</li>
                        <li style="margin-bottom: 8px;">Monitor your net worth across multiple currencies</li>
                    </ul>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #856404; margin-top: 0;">⏰ Important Notes:</h4>
                    <ul style="color: #856404; padding-left: 20px; margin-bottom: 0;">
                        <li style="margin-bottom: 8px;">This verification code expires in 30 minutes</li>
                        <li style="margin-bottom: 8px;">Use this code only on the official Imhotep website</li>
                        <li style="margin-bottom: 8px;">If you didn't create an account, please ignore this email</li>
                        <li style="margin-bottom: 8px;">Contact support if you experience any issues</li>
                    </ul>
                </div>
                
                <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                    This verification email was sent to {user_mail}. If you didn't request this registration or have any questions, please contact our support team at 
                    <a href="mailto:imhoteptech@outlook.com" style="color: #51adac;">imhoteptech@outlook.com</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                    Imhotep Financial Manager Team
                </p>
                <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                    Your journey to financial success starts here.
                </p>
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                    © 2025 Imhotep Financial Manager. All rights reserved.<br>
                    This is an automated verification email. Please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "📧 Email Verification - Imhotep Financial Manager", body, is_html)
    if error:
        print(error)

    session["verification_code"] = verification_code
from flask import render_template, session, request, Blueprint, redirect
from config import Config, CSRFForm
from extensions import db
from sqlalchemy import text
from werkzeug.security import generate_password_hash
from utils.send_mail import send_verification_mail_code, smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail

register_bp = Blueprint('register', __name__)

@register_bp.route("/register_page", methods=["GET"])
def register_page():
    """Render the registration page."""
    return render_template("register.html", form=CSRFForm())

@register_bp.route("/register", methods=["POST", "GET"])
def register():
    """Handle user registration and store user data in the database."""
    if request.method == "GET": #handle get request
        return redirect("register_page") #redirect to registration page
    user_username = (request.form.get("user_username").strip()).lower() #get username from form
    user_password = request.form.get("user_password") #get password from form
    user_mail = request.form.get("user_mail").lower() #get email from form

    if "@" in user_username: #validate username format
        error = "username should not have @" #username validation error
        return render_template("register.html", error=error, form=CSRFForm())

    if "@" not in user_mail: #validate email format
        error = "mail should have @" #email validation error
        return render_template("register.html", error=error, form=CSRFForm())

    #check if username already exists in database
    existing_username = db.session.execute(
        text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
        {"user_username": user_username}
    ).fetchall()
    if existing_username:
        error_existing = "Username is already in use. Please choose another one. or " #username already taken error
        return render_template("register.html", error=error_existing, form=CSRFForm())

    #check if email already exists in database
    existing_mail = db.session.execute(
        text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
        {"user_mail": user_mail}
    ).fetchall()
    if existing_mail:
        error_existing = "Mail is already in use. Please choose another one. or " #email already taken error
        return render_template("register.html", error=error_existing, form=CSRFForm())

    #get the last user_id in the database
    try:
        last_user_id = db.session.execute(
            text("SELECT MAX(user_id) FROM users")
        ).fetchone()[0]
        user_id = last_user_id + 1 #increment for new user
    except:
        user_id = 1 #first user in database

    session["user_id"] = user_id #store user id in session
    hashed_password = generate_password_hash(user_password) #hash the password

    send_verification_mail_code(user_mail) #send verification email

    #insert new user into database
    db.session.execute(
        text("INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency) VALUES (:user_id, :user_username, :user_password, :user_mail, :user_mail_verify, :favorite_currency)"),
        {"user_id": user_id ,"user_username": user_username, "user_password": hashed_password, "user_mail": user_mail, "user_mail_verify": "not_verified", "favorite_currency": "USD"}
    )
    db.session.commit() #commit changes to database

    return render_template("mail_verify.html", user_mail=user_mail, user_username=user_username, form=CSRFForm()) #render email verification page

@register_bp.route("/mail_verification", methods=["POST", "GET"])
def mail_verification():
    """Verify the user's email address and activate their account."""
    if request.method == "GET": #handle get request
        return render_template("mail_verify.html", form=CSRFForm()) #render verification page
    else: #handle post request

        verification_code = request.form.get("verification_code").strip().lower() #get verification code from form
        user_id = session.get("user_id") #get user id from session
        user_mail = request.form.get("user_mail") #get email from form
        user_username = request.form.get("user_username") #get username from form

        if verification_code == session.get("verification_code"): #verify the code
            #update user verification status in database
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify WHERE user_id = :user_id"), {"user_mail_verify" :"verified", "user_id": user_id}
                )
            db.session.commit() #commit changes to database
            is_html = True #set email format to html
            body = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verified - Imhotep Financial Manager</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            ✅ Email Verified Successfully!
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Welcome to Imhotep Financial Manager
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                            Congratulations, {user_username}! 🎉
                        </h2>
                        
                        <p style="font-size: 16px; margin-bottom: 20px; color: #555;">
                            Your email address has been successfully verified! You can now access all features of Imhotep Financial Manager.
                        </p>
                        
                        <div style="background-color: #e8f5f5; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #51adac; margin-top: 0;">🚀 You're all set! Here's what you can do next:</h4>
                            <ul style="color: #555; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">Set up your financial goals</li>
                                <li style="margin-bottom: 8px;">Start tracking your expenses</li>
                                <li style="margin-bottom: 8px;">Explore our powerful analytics tools</li>
                                <li style="margin-bottom: 8px;">Connect with our community of financial achievers</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://imhotepf.pythonanywhere.com/login_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                                🎯 Start Managing Your Finances
                            </a>
                        </div>
                        
                        <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                            Thank you for joining the Imhotep family! We're excited to help you achieve your financial goals.
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                            The Imhotep Financial Manager Team
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                            Your journey to financial freedom starts now!
                        </p>
                        <div style="margin: 20px 0;">
                            <a href="https://instagram.com/imhotep_tech" style="color: #ffffff; text-decoration: none; margin: 0 10px; font-size: 18px;">📱</a>
                            <a href="https://x.com/imhoteptech1" style="color: #ffffff; text-decoration: none; margin: 0 10px; font-size: 18px;">🐦</a>
                            <a href="mailto:imhoteptech@outlook.com" style="color: #ffffff; text-decoration: none; margin: 0 10px; font-size: 18px;">📧</a>
                        </div>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            © 2025 Imhotep Financial Manager. All rights reserved.<br>
                            Powered by Imhotep Tech
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """ #email verification success html template
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "✅ Email Verified - Welcome to Imhotep Financial Manager!", body, is_html) #send verification success email
            if error:
                print(error) #print error if email sending fails
                
            success = "Email verified successfully. You can now log in." #success message
            return render_template("login.html", success=success, form=CSRFForm())

        else:
            error="Invalid verification code." #invalid code error
            return render_template("mail_verify.html", error=error, form=CSRFForm())

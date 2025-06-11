from flask import url_for, Blueprint, render_template, session, redirect, request
from authlib.integrations.flask_client import OAuth
from authlib.integrations.base_client.errors import OAuthError
from extensions import oauth, db
from sqlalchemy import text
from config import CSRFForm
from utils.google_utils import save_profile_picture
from werkzeug.security import generate_password_hash, check_password_hash
from utils.send_mail import send_verification_mail_code, smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail

google_sign_bp = Blueprint('google_sign', __name__)

@google_sign_bp.route("/register_google")
def login_google():
    google = oauth.create_client('google')  # create the google oauth client
    redirect_uri = url_for('google_sign.authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@google_sign_bp.route('/authorize')
def authorize():
    google = oauth.create_client('google')
    try:
        # create the google oauth client
        token = google.authorize_access_token()
        # Access token from google (needed to get user info)
        resp = google.get('userinfo')
        # userinfo contains stuff u specificed in the scrope
        user_info = resp.json()
        user = oauth.google.userinfo()# uses openid endpoint to fetch user info

        user_mail = user_info["email"]
        user_username = user_mail.split('@')[0]
        user_mail_verify = user_info["verified_email"]
        user_photo_url = user_info["picture"]

        existing_mail = db.session.execute(
            text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
            {"user_mail": user_mail}
        ).fetchall()
        if existing_mail:
            user = db.session.execute(
                text("SELECT user_id FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
            ).fetchone()[0]

            session["logged_in"] = True
            session["user_id"] = user
            session.permanent = True
            return redirect("/home")

        session["user_mail"] = user_mail
        session["user_mail_verify"] = user_mail_verify
        session["user_photo_url"] = user_photo_url

        existing_username = db.session.execute(
            text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
            {"user_username": user_username}
        ).fetchall()
        if existing_username:
            #error_existing = "Username is already in use. Please choose another one."
            return render_template("add_username_google_login.html", form=CSRFForm())

        session["user_username"] = user_username
        return render_template('add_password_google_login.html', form=CSRFForm())

    except OAuthError as error:
        # Catch the OAuthError and handle it
        if error.error == 'access_denied':
            error_message = "Google login was canceled. Please try again."
            return render_template("login.html", error=error_message, form=CSRFForm())
        else:
            error_message = "An error occurred. Please try again."
            return render_template("login.html", error=error_message, form=CSRFForm())

@google_sign_bp.route("/add_password_google_login", methods=["POST"])
def add_password_google_login():

    user_password = request.form.get("user_password")

    hashed_password = generate_password_hash(user_password)

    user_username = session.get("user_username")
    user_mail = session.get("user_mail")
    user_mail_verify = session.get("user_mail_verify")
    user_photo_url = session.get("user_photo_url")

    try:
        last_user_id = db.session.execute(
            text("SELECT MAX(user_id) FROM users")
        ).fetchone()[0]
        user_id = last_user_id + 1
    except:
        user_id = 1

    if user_photo_url:
        user_photo_path = save_profile_picture(user_photo_url, user_id)

    db.session.execute(
        text("INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency, user_photo_path) VALUES (:user_id, :user_username, :user_password, :user_mail, :user_mail_verify, :favorite_currency, :user_photo_path)"),
        {"user_id": user_id ,"user_username": user_username, "user_password": hashed_password, "user_mail": user_mail, "user_mail_verify": "verified", "favorite_currency": "USD", "user_photo_path":user_photo_path}
    )
    db.session.commit()

    is_html = True
    body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Imhotep Financial Manager</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                    🏛️ Imhotep Financial Manager
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                    Your Trusted Financial Partner
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                    Welcome to Your Financial Journey, {user_username}! 🎉
                </h2>
                
                <p style="font-size: 16px; margin-bottom: 20px; color: #555;">
                    We're absolutely thrilled to have you join the Imhotep Financial Manager family! Your journey towards financial freedom and smart money management starts right here.
                </p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #51adac; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #51adac; margin-top: 0; font-size: 18px;">🚀 What You Can Do Next:</h3>
                    <ul style="color: #555; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>Track Expenses:</strong> Monitor your daily spending with ease</li>
                        <li style="margin-bottom: 8px;"><strong>Manage Income:</strong> Keep tabs on all your revenue streams</li>
                        <li style="margin-bottom: 8px;"><strong>Set Financial Goals:</strong> Plan for your dreams and achieve them</li>
                        <li style="margin-bottom: 8px;"><strong>Generate Reports:</strong> Get insights with detailed analytics</li>
                        <li style="margin-bottom: 8px;"><strong>Multi-Currency Support:</strong> Work with 170+ currencies worldwide</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://https://imhotepf.pythonanywhere.com/" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; transition: transform 0.3s ease;">
                        🎯 Start Managing Your Finances
                    </a>
                </div>
                
                <div style="background-color: #e8f5f5; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #51adac; margin-top: 0;">💡 Pro Tip:</h4>
                    <p style="margin-bottom: 0; color: #555;">
                        Start by setting up your first financial goal. Whether it's saving for a vacation, building an emergency fund, or investing for retirement, having a clear target makes all the difference!
                    </p>
                </div>
                
                <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                    Need help getting started? Our support team is here to assist you every step of the way. Simply reply to this email or visit our help center.
                </p>
                
                <p style="font-size: 16px; color: #555;">
                    Here's to your financial success! 🌟
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                    The Imhotep Financial Manager Team
                </p>
                <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                    Empowering your financial future, one decision at a time.
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
    """
    success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "🎉 Welcome to Imhotep Financial Manager - Your Journey Begins!", body, is_html)
    if error:
        print(error)

    session["logged_in"] = True
    session["user_id"] = user_id
    session.permanent = True
    return redirect("/home")

@google_sign_bp.route("/add_username_google_login", methods=["POST"])
def add_username_google_login():

    user_username = request.form.get("user_username")

    existing_username = db.session.execute(
        text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
        {"user_username": user_username}
    ).fetchall()
    if existing_username:
        error_existing = "Username is already in use. Please choose another one."
        return render_template("add_username_google_login.html", form=CSRFForm(), error=error_existing)

    session["user_username"] = user_username
    return render_template('add_password_google_login.html', form=CSRFForm())

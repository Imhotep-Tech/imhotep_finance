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
    <h3>Welcome to Imhotep Financial Manager, {user_username}!</h3>
    <p>We are excited to have you on board. Imhotep Financial Manager is your go-to solution for managing your finances efficiently and effectively.</p>
    <p>Here are some features you can explore:</p>
    <ul>
        <li>Track your expenses and income</li>
        <li>Set financial goals</li>
        <li>Generate financial reports</li>
        <li>And much more!</li>
    </ul>
    <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
    <p>Thank you for joining us, and we look forward to helping you achieve your financial goals.</p>
    <p>Best regards,</p>
    <p>The Imhotep Financial Manager Team</p>
    """
    success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Welcome to Imhotep Financial Manager", body, is_html)
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

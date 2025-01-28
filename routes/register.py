from flask import render_template, session, request, Blueprint
from config import Config, CSRFForm
from extensions import db
from sqlalchemy import text
from werkzeug.security import generate_password_hash
from utils.send_mail import send_verification_mail_code, smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail

register_bp = Blueprint('register', __name__)

@register_bp.route("/register_page", methods=["GET"])
def register_page():
    return render_template("register.html", form=CSRFForm())

@register_bp.route("/register", methods=["POST"])
def register():
    user_username = (request.form.get("user_username").strip()).lower()
    user_password = request.form.get("user_password")
    user_mail = request.form.get("user_mail").lower()

    if "@" in user_username:
        error = "username should not have @"
        return render_template("register.html", error=error, form=CSRFForm())

    if "@" not in user_mail:
        error = "mail should have @"
        return render_template("register.html", error=error, form=CSRFForm())

    existing_username = db.session.execute(
        text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
        {"user_username": user_username}
    ).fetchall()
    if existing_username:
        error_existing = "Username is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing, form=CSRFForm())

    existing_mail = db.session.execute(
        text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
        {"user_mail": user_mail}
    ).fetchall()
    if existing_mail:
        error_existing = "Mail is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing, form=CSRFForm())

    try:
        last_user_id = db.session.execute(
            text("SELECT MAX(user_id) FROM users")
        ).fetchone()[0]
        user_id = last_user_id + 1
    except:
        user_id = 1

    session["user_id"] = user_id
    hashed_password = generate_password_hash(user_password)

    send_verification_mail_code(user_mail)

    db.session.execute(
        text("INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency) VALUES (:user_id, :user_username, :user_password, :user_mail, :user_mail_verify, :favorite_currency)"),
        {"user_id": user_id ,"user_username": user_username, "user_password": hashed_password, "user_mail": user_mail, "user_mail_verify": "not_verified", "favorite_currency": "USD"}
    )
    db.session.commit()

    return render_template("mail_verify.html", user_mail=user_mail, user_username=user_username, form=CSRFForm())

@register_bp.route("/mail_verification", methods=["POST", "GET"])
def mail_verification():
    if request.method == "GET":
        return render_template("mail_verify.html", form=CSRFForm())
    else:

        verification_code = request.form.get("verification_code").strip()
        user_id = session.get("user_id")
        user_mail = request.form.get("user_mail")
        user_username = request.form.get("user_username")
        if verification_code == session.get("verification_code"):
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify WHERE user_id = :user_id"), {"user_mail_verify" :"verified", "user_id": user_id}
                )
            db.session.commit()
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

            success="Email verified successfully. You can now log in."
            return render_template("login.html", success=success, form=CSRFForm())

        else:
            error="Invalid verification code."
            return render_template("mail_verify.html", error=error, form=CSRFForm())

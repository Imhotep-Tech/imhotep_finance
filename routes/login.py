from flask import render_template, Blueprint, session, request, redirect
from extensions import db
from config import CSRFForm
from utils.security import check_password_hash
from sqlalchemy import text
from utils.send_mail import send_verification_mail_code, smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail
from werkzeug.security import generate_password_hash
import secrets
from utils.security import logout

login_bp = Blueprint('login', __name__)

@login_bp.route("/login_page", methods=["GET"])
def login_page():
    if session.get("logged_in"):
        return redirect("/home")
    else:
        return render_template("login.html", form=CSRFForm())

@login_bp.route("/trial_login", methods=["POST"])
def trial_login():
    # Assuming the test user has user_id = 1
    test_user_id = 1
    session["logged_in"] = True
    session["user_id"] = test_user_id
    session.permanent = True
    return redirect("/home")

@login_bp.route("/login", methods=["POST"])
#@limiter.limit("3 per minute")
def login():
    user_username_mail = (request.form.get("user_username_mail").strip()).lower()
    user_password = request.form.get("user_password")

    if "@" in user_username_mail:
        try:
            login_db = db.session.execute(
            text("SELECT user_password, user_mail_verify FROM users WHERE LOWER(user_mail) = :user_mail"),
            {"user_mail": user_username_mail}
            ).fetchall()[0]

            password_db = login_db[0]
            user_mail_verify = login_db[1]

            if check_password_hash(password_db, user_password):
                if user_mail_verify == "verified":
                    user = db.session.execute(
                        text("SELECT user_id FROM users WHERE LOWER(user_mail) = :user_mail AND user_password = :user_password"),
                        {"user_mail": user_username_mail, "user_password": password_db}
                    ).fetchone()[0]

                    session["logged_in"] = True
                    session["user_id"] = user
                    session.permanent = True
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified"
                    return render_template("login.html", error_verify=error_verify, form=CSRFForm())
            else:
                error = "Your username or password are incorrect!"
                return render_template("login.html", error=error, form=CSRFForm())
        except:
            error = "Your E-mail or password are incorrect!"
            return render_template("login.html", error=error, form=CSRFForm())
    else:
        try:
            login_db = db.session.execute(
                    text("SELECT user_password, user_mail_verify FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username_mail}
                ).fetchall()[0]
            password_db = login_db[0]
            user_mail_verify = login_db[1]

            if check_password_hash(password_db, user_password):
                if user_mail_verify == "verified":
                    user = db.session.execute(
                        text("SELECT user_id FROM users WHERE LOWER(user_username) = :user_username AND user_password = :user_password"),
                        {"user_username": user_username_mail, "user_password": password_db}
                    ).fetchone()[0]

                    session["logged_in"] = True
                    session["user_id"] = user
                    session.permanent = True
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified"
                    return render_template("login.html", error_verify=error_verify, form=CSRFForm())
            else:
                error = "Your username or password are incorrect!"
                return render_template("login.html", error=error, form=CSRFForm())
        except:
            error = "Your username or password are incorrect!"
            return render_template("login.html", error=error, form=CSRFForm())

@login_bp.route("/manual_mail_verification", methods=["POST", "GET"])
def manual_mail_verification():
    if request.method == "GET":
        return render_template("manual_mail_verification.html", form=CSRFForm())
    else:
        user_mail = (request.form.get("user_mail").strip()).lower()
        try:
            mail_verify_db = db.session.execute(
                text("SELECT user_id, user_mail_verify FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
                ).fetchall()[0]
            user_id = mail_verify_db[0]
            mail_verify = mail_verify_db[1]
        except:
            error_not = "This mail isn't used on the webapp!"
            return render_template("manual_mail_verification.html", error_not = error_not, form=CSRFForm())

        if mail_verify == "verified":
            error = "This Mail is already used and verified"
            return render_template("login.html", error=error, form=CSRFForm())
        else:
            session["user_id"] = user_id
            send_verification_mail_code(user_mail)
            return render_template("mail_verify.html", form=CSRFForm())

@login_bp.route("/forget_password",methods=["POST", "GET"])
def forget_password():
    if request.method == "GET":
        return render_template("forget_password.html", form=CSRFForm())
    else:

        user_mail = request.form.get("user_mail")
        try:
            db.session.execute(
                text("SELECT user_mail FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
            ).fetchall()[0]

            temp_password = secrets.token_hex(4)
            is_html = True
            body = f"""
            <h3>Temporary Password</h3>
            <p>Dear User,</p>
            <p>We have received a request to reset your password. Please use the following temporary password to log in to your account:</p>
            <h1>{temp_password}</h1>
            <p>After logging in, we recommend that you change your password immediately for security reasons.</p>
            <p>If you did not request this email, please ignore it and contact our support team immediately.</p>
            <p>Best regards,</p>
            <p>The Imhotep Financial Manager Team</p>
            """
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Temporary Password", body, is_html)
            if error:
                print(error)

            hashed_password = generate_password_hash(temp_password)
            db.session.execute(
                text("UPDATE users SET user_password = :user_password WHERE user_mail = :user_mail"), {"user_password" :hashed_password, "user_mail": user_mail}
                )
            db.session.commit()

            success="The Mail is sent check Your mail for your new password"
            return render_template("login.html", success=success, form=CSRFForm())
        except:
            error = "This Email isn't saved"
            return render_template("forget_password.html", error = error, form=CSRFForm())

@login_bp.route("/logout", methods=["GET", "POST"])
def logout_route():
        logout()
        return redirect("/login_page")

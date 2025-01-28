from flask import session, redirect, render_template, request, Blueprint
from config import CSRFForm, Config
from extensions import db
from utils.user_info import select_user_photo, select_user_data
from utils.currencies import show_networth, select_favorite_currency
from utils.security import security_check
from sqlalchemy import text
from imhotep_files_flask import upload_file, delete_file
import os
from werkzeug.security import generate_password_hash
from utils.security import logout
from sqlalchemy.exc import OperationalError
from datetime import datetime
from utils.send_mail import send_verification_mail_code, smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail

settings_bp = Blueprint('settings', __name__)

@settings_bp.route("/settings/personal_info", methods=["GET", "POST"])
def personal_info():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        if request.method == "GET":
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
        else:

            user_username = request.form.get("user_username")
            user_mail = request.form.get("user_mail")
            user_photo_path = request.form.get("user_photo_path")

            if "@" in user_username:
                error_existing = "username should not have @"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            if "@" not in user_mail:
                error_existing = "mail should have @"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            user_username_mail_db = db.session.execute(
                text("SELECT user_mail, user_username FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()

            user_mail_db = user_username_mail_db[0]
            user_username_db = user_username_mail_db[1]

            if user_mail != user_mail_db and user_username != user_username_db:

                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()

                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_mail:
                    error_existing = "Mail is already in use. Please choose another one."
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                if existing_username:
                    error_existing = "Username is already in use. Please choose another one."
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                send_verification_mail_code(user_mail)
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, form=CSRFForm())

            if user_mail != user_mail_db:
                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()

                if existing_mail:
                    error_existing = "Mail is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                send_verification_mail_code(user_mail)
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, form=CSRFForm())

            if user_username != user_username_db:
                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_username:
                    error_existing = "Username is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                db.session.execute(
                    text("UPDATE users SET user_username = :user_username WHERE user_id = :user_id"),
                    {"user_username" :user_username, "user_id":user_id}
                )
                db.session.commit()
                done = "User Name Changed Successfully!"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        user_username, user_mail, user_photo_path = select_user_data(user_id)
        return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/personal_info/mail_verification", methods=["POST"])
def mail_verification_change_mail():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        verification_code = request.form.get("verification_code").strip()
        user_mail = request.form.get("user_mail")
        user_username = request.form.get("user_username")
        user_mail_db = request.form.get("user_mail_db")

        if verification_code == session.get("verification_code"):
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify, user_mail = :user_mail, user_username = :user_username WHERE user_id = :user_id"),
                {"user_mail_verify" :"verified", "user_mail" :user_mail, "user_username": user_username, "user_id":user_id}
            )
            db.session.commit()

            is_html = True
            body = f"Your E-mail has been changed now to {user_mail}"
            success, error = send_mail(smtp_server , smtp_port , email_send , email_send_password , user_mail_db, "Email Verification" ,body, is_html)
            if error:
                print(error)

            is_html = True
            body = f"Welcome {user_username} To Imhotep Finacial Manager"
            success, error = send_mail(smtp_server , smtp_port , email_send , email_send_password , user_mail, "Email Verification" ,body, is_html)
            if error:
                print(error)

            done = "User Mail Changed Successfully!"
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
        else:
            error="Invalid verification code."
            return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, error=error, form=CSRFForm())

@settings_bp.route("/settings/personal_info/upload_user_photo", methods=["POST"])
def upload_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        photo_path, upload_error = upload_file(request, os.path.join(os.getcwd(), "static", "user_photo"), (".png", ".jpg", ".jpeg"), user_id)

        if upload_error:
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=upload_error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        photo_name = photo_path.split("/")[-1]

        db.session.execute(
            text("UPDATE users SET user_photo_path = :user_photo_path WHERE user_id = :user_id"),
            {"user_photo_path": photo_name, "user_id":user_id}
        )
        db.session.commit()
        user_username, user_mail, user_photo_path = select_user_data(user_id)
        return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/personal_info/delete_user_photo", methods=["POST"])
def delete_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        photo_name = db.session.execute(
            text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchone()[0]

        if photo_name:
            photo_path = os.path.join(Config.UPLOAD_FOLDER_PHOTO, photo_name)

            delete_photo , error = delete_file(photo_path)
            if error:
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            db.session.execute(
                    text("UPDATE users SET user_photo_path = NULL WHERE user_id = :user_id"),
                    {"user_id" :user_id}
                )
            db.session.commit()
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
        else:
            error = "No image associated with this user to delete."
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/favorite_currency", methods=["GET", "POST"])
def favorite_currency():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        user_id = session.get("user_id")
        if request.method == "GET":
            favorite_currency = select_favorite_currency(user_id)
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("favorite_currency.html", favorite_currency=favorite_currency, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, form=CSRFForm())
        else:
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            favorite_currency = select_favorite_currency(user_id)

            favorite_currency = request.form.get("favorite_currency")

            db.session.execute(
                text("UPDATE users SET favorite_currency = :favorite_currency WHERE user_id = :user_id"),
                {"favorite_currency" :favorite_currency, "user_id" :user_id}
            )
            db.session.commit()

            done = f"Your favorite currency is {favorite_currency} now"
            return render_template("favorite_currency.html", done=done, favorite_currency=favorite_currency, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/security_check", methods=["POST", "GET"])
def security_check_password():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_id = session.get("user_id")
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        if request.method == "GET":
            return render_template("check_pass.html", form=CSRFForm())
        else:

            user_id = session.get("user_id")
            check_pass = request.form.get("check_pass")
            security = security_check(user_id, check_pass)

            if security:
                return render_template("change_pass.html", user_id = user_id, form=CSRFForm())
            else:
                error = "This password is incorrect!"
                return render_template("check_pass.html", error = error, form=CSRFForm())

@settings_bp.route("/settings/security", methods=["POST"])
def security():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        user_id = session.get("user_id")
        new_password = request.form.get("new_password")

        user_mail = db.session.execute(
            text("SELECT user_mail FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchone()[0]

        hashed_password = generate_password_hash(new_password)
        db.session.execute(
            text("UPDATE users SET user_password = :user_password WHERE user_id = :user_id"),
            {"user_password" :hashed_password, "user_id" :user_id}
        )
        db.session.commit()

        is_html = True
        body = f"""
        <h3>Password Changed Successfully</h3>
        <p>Dear User,</p>
        <p>Your password has been successfully changed. If you did not request this change, please contact our support team immediately.</p>
        <p>For your security, please do not share your password with anyone.</p>
        <p>If you have any questions or need further assistance, feel free to reach out to our support team.</p>
        <p>Best regards,</p>
        <p>The Imhotep Financial Manager Team</p>
        """
        success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Password Changed", body, is_html)
        if error:
            print(error)

        logout()
        success = "You password has been changed successfully!"
        return render_template("login.html", success = success, form=CSRFForm())

@settings_bp.route("/settings/set_target", methods=["GET","POST"])
def set_target():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            now = datetime.now()
            mounth = now.month
            year = now.year
            target_db = db.session.execute(
                text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id" :user_id, "mounth" : mounth, "year":year}
            ).fetchall()
            if target_db:
                target_db = target_db[0]
                return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, target_db=target_db, form=CSRFForm())
            else:
                return render_template("set_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, form=CSRFForm())
        else:

            target = request.form.get("target")

            now = datetime.now()
            mounth = now.month
            year = now.year

            try:
                last_target_id = db.session.execute(
                        text("SELECT MAX(target_id) FROM target")
                    ).fetchone()[0]
                target_id = last_target_id + 1
            except:
                target_id = 1

            db.session.execute(
                text("INSERT INTO target (target_id, user_id, target, mounth, year) VALUES (:target_id, :user_id, :target, :mounth, :year)"),
                {"target_id":target_id, "user_id" :user_id, "target": target, "mounth" :mounth, "year" :year}
            )
            db.session.commit()
            done = "Your Target have been set"
            target_db = db.session.execute(
                text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id" :user_id, "mounth" : mounth, "year":year}
            ).fetchall()[0]
            return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target=target, target_db=target_db, form=CSRFForm())

@settings_bp.route("/settings/update_target", methods=["POST"])
def update_target():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        target = request.form.get("target")

        now = datetime.now()
        mounth = now.month
        year = now.year

        target_id = db.session.execute(
                text("SELECT target_id FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id": user_id, "mounth": mounth, "year":year}
            ).fetchone()[0]

        db.session.execute(
            text("UPDATE target SET target = :target WHERE target_id = :target_id"),
            {"target_id":target_id, "target": target}
        )
        db.session.commit()

        target_db = db.session.execute(
            text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
            {"user_id" :user_id, "mounth" : mounth, "year":year}
        ).fetchall()[0]

        done = "Your Target have been updated"
        return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target_db=target_db, form=CSRFForm())
    

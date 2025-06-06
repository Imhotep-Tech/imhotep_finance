from flask import render_template, redirect, session, request, Blueprint
import secrets
from sqlalchemy import text
import datetime
from sqlalchemy.exc import OperationalError
from utils.user_info import select_user_photo
from utils.currencies import show_networth, convert_to_fav_currency
from utils.security import security_check, logout
from config import CSRFForm
from extensions import db
from utils.send_mail import smtp_server, smtp_port, email_send, email_send_password
from imhotep_mail import send_mail

user_bp = Blueprint('user', __name__)

# the home screen that shows a lot of info
@user_bp.route("/home", methods=["GET"])
def home():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        #gets the user photo
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        #gets the user id and the total networth of the user
        user_id = session.get("user_id")
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"

        # gets the user target points
        target_db = db.session.execute(
            text("SELECT * FROM target WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        #if the user has a target from the db
        if target_db:
            target_db = sorted(target_db, key=lambda x: (x[4], x[3]), reverse=True)
            target = target_db[0][2]
            mounth_db = int(target_db[0][3])
            year_db = int(target_db[0][4])
            now = datetime.datetime.now()
            mounth = now.month
            year = now.year

            #if this is a new mounth with the year then add the new mounthly data to the database 
            if mounth_db != mounth and year_db != year:
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

            first_day_current_month = now.replace(day=1)

            if now.month == 12:
                first_day_next_month = now.replace(year=now.year + 1, month=1, day=1)
            else:
                first_day_next_month = now.replace(month=now.month + 1, day=1)

            from_date = first_day_current_month.date()
            to_date = first_day_next_month.date()

            taregt_db_1 = db.session.execute(
                text("SELECT target FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id": user_id, "mounth": mounth, "year": year}
            ).fetchone()

            if taregt_db_1:
                target = taregt_db_1[0]
                score_deposite = db.session.execute(
                    text("SELECT amount, currency FROM trans WHERE user_id = :user_id AND date BETWEEN :from_date AND :to_date AND trans_status = :trans_status"),
                    {"user_id": user_id, "from_date": from_date, "to_date": to_date, "trans_status": "deposit"}
                ).fetchall()

                score_withdraw = db.session.execute(
                    text("SELECT amount, currency FROM trans WHERE user_id = :user_id AND date BETWEEN :from_date AND :to_date AND trans_status = :trans_status"),
                    {"user_id": user_id, "from_date": from_date, "to_date": to_date, "trans_status": "withdraw"}
                ).fetchall()

                currency_totals_deposite = {}
                for amount, currency in score_deposite:
                    amount = float(amount)
                    if currency in currency_totals_deposite:
                        currency_totals_deposite[currency] += amount
                    else:
                        currency_totals_deposite[currency] = amount
                total_favorite_currency_deposite, favorite_currency_deposite = convert_to_fav_currency(currency_totals_deposite, user_id)

                currency_totals_withdraw= {}
                for amount, currency in score_withdraw:
                    amount = float(amount)
                    if currency in currency_totals_withdraw:
                        currency_totals_withdraw[currency] += amount
                    else:
                        currency_totals_withdraw[currency] = amount
                total_favorite_currency_withdraw, favorite_currency_withdraw = convert_to_fav_currency(currency_totals_withdraw, user_id)

                score = (total_favorite_currency_deposite - target) - total_favorite_currency_withdraw
                if score > 0:
                    score_txt = "Above Target"
                elif score < 0:
                    score_txt = "Below Target"
                else:
                    score_txt = "On Target"

                db.session.execute(
                    text("UPDATE target SET score = :score WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                    {"user_id" :user_id, "score":score,  "mounth" :mounth, "year" :year}
                )
                db.session.commit()
                return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path, score_txt=score_txt, score=score, target = target, form=CSRFForm())
        else:
            return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path, form=CSRFForm())

@user_bp.route("/show_networth_details", methods=["GET"])
def show_networth_details():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Database connection error. Please try again."
            return render_template('error.html', error=error, form=CSRFForm())
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        
        networth_details_db = db.session.execute(
            text("SELECT currency, total FROM networth WHERE user_id = :user_id ORDER BY total DESC"),
            {"user_id": user_id}
        ).fetchall()

        networth_details = dict(networth_details_db)
        
        return render_template("networth_details.html", 
                             networth_details=networth_details, 
                             user_photo_path=user_photo_path, 
                             total_favorite_currency=total_favorite_currency, 
                             favorite_currency=favorite_currency, 
                             form=CSRFForm())

@user_bp.route("/delete_user", methods=["POST", "GET"])
def delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    elif session.get("user_id") == 1:
        error = "this is a trial you can't delete that account!"
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        return render_template("check_pass_delete_user.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, form=CSRFForm())

@user_bp.route("/delete_user/check_pass", methods=["POST"])
def check_pass_delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    elif session.get("user_id") == 1:
        error = "this is a trial you can't delete that account!"
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        check_pass = request.form.get("check_pass")
        security = security_check(user_id, check_pass)

        if security:
            user_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE user_id = :user_id"),
                {"user_id": user_id}
            ).fetchone()[0]

            verification_code = secrets.token_hex(4)

            is_html = True
            body = f"""
            <h3>Account Deletion Verification</h3>
            <p>Dear User,</p>
            <p>We have received a request to delete your account. To proceed with the deletion, please use the following verification code:</p>
            <h1>{verification_code}</h1>
            <p>Please enter this code on the verification page to confirm the deletion of your account.</p>
            <p>If you did not request this action, please ignore this email and contact our support team immediately.</p>
            <p>Best regards,</p>
            <p>The Imhotep Financial Manager Team</p>
            """
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Delete Verification", body, is_html)
            if error:
                print(error)

            session["verification_code"] = verification_code

            return render_template("mail_verify_delete_user.html", user_id = user_id, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, form=CSRFForm())
        else:
            error = "This password is incorrect!"
            return render_template("check_pass_delete_user.html", error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, form=CSRFForm())

@user_bp.route("/delete_user/verify_delete_user", methods=["POST"])
def verify_delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    elif session.get("user_id") == 1:
        error = "this is a trial you can't delete that account!"
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:

        verification_code = request.form.get("verification_code").strip().lower()
        user_id = session.get("user_id")
        if verification_code == session.get("verification_code"):

            db.session.execute(
                text("DELETE FROM networth WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()

            db.session.execute(
                text("DELETE FROM trans WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()

            db.session.execute(
                text("DELETE FROM target WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()

            db.session.execute(
                text("DELETE FROM wishlist WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()

            user_mail = request.form.get("user_mail")

            is_html = True
            body = f"""
            <h3>Account Deleted</h3>
            <p>Dear User,</p>
            <p>We are sorry to see you go. Your account has been successfully deleted.</p>
            <p>We would appreciate it if you could take a moment to let us know why you decided to delete your account. Your feedback is valuable to us and will help us improve our services.</p>
            <p>Please click the link below to fill out a short feedback form:</p>
            <p><a href="https://forms.gle/FZVhQXnticjx16228">Feedback Form</a></p>
            <p>If you have any questions or need further assistance, feel free to reach out to our support team.</p>
            <p>Best regards,</p>
            <p>The Imhotep Financial Manager Team</p>
            """
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "Account Deleted", body, is_html)
            if error:
                print(error)

            db.session.execute(
                text("DELETE FROM users WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()
            logout()

            success="Account Deleted"
            return render_template("login.html", success=success, form=CSRFForm())

        else:
            error="Invalid verification code."
            return render_template("mail_verify_delete_user.html", error=error, form=CSRFForm())

@user_bp.route("/show_scores_history", methods=["GET"])
def show_scores_history():
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

        page = int(request.args.get("page", 1))  # Default to page 1
        per_page = 20  # Number of records per page

        offset = (page - 1) * per_page

        target_history = db.session.execute(
            text("SELECT target, mounth, year, score FROM target WHERE user_id = :user_id ORDER BY target_id DESC LIMIT :limit OFFSET :offset"),
            {"user_id":user_id, "limit":per_page, "offset":offset}
        ).fetchall()
        
        if not target_history:
            target_history = []

        # Get total count for pagination
        total_count = db.session.execute(
            text('''
                SELECT COUNT(*) FROM target
                WHERE user_id = :user_id
            '''),
            {"user_id": user_id}
        ).scalar()

        total_pages = (total_count + per_page - 1) // per_page  # Calculate total number of pages

        return render_template("show_scores_history.html", target_history=target_history, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, total_pages=total_pages,page=page, form=CSRFForm())

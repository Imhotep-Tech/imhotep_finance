from flask import render_template, redirect, session, request, Blueprint
import secrets
from sqlalchemy import text
import datetime
from sqlalchemy.exc import OperationalError
from utils.user_info import select_user_photo, calculate_user_report
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
            if mounth_db != mounth or year_db != year:
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
                # If no target found for current month/year, redirect to set target
                return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path, form=CSRFForm())
        else:
            # If no target exists at all, show home without target info
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
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account Deletion Verification - Imhotep Financial Manager</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            ⚠️ Account Deletion Request
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Imhotep Financial Manager Security
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                            <h3 style="color: #721c24; margin-top: 0; font-size: 18px;">🚨 Critical Security Alert</h3>
                            <p style="margin-bottom: 0; color: #721c24;">
                                We have received a request to permanently delete your account. This action cannot be undone.
                            </p>
                        </div>
                        
                        <h2 style="color: #dc3545; margin-bottom: 20px; font-size: 24px;">
                            Account Deletion Verification Required
                        </h2>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Dear User,
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            We have received a request to delete your Imhotep Financial Manager account. To proceed with this permanent action, please use the verification code below:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #dc3545; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                            <h1 style="color: #dc3545; font-family: 'Courier New', monospace; font-size: 32px; margin: 0; letter-spacing: 3px; font-weight: bold;">
                                {verification_code}
                            </h1>
                        </div>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #856404; margin-top: 0;">⚠️ Before You Proceed:</h4>
                            <ul style="color: #856404; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">Account deletion is permanent and cannot be undone</li>
                                <li style="margin-bottom: 8px;">All your financial data, transactions, and reports will be lost</li>
                                <li style="margin-bottom: 8px;">Your targets and wishlist items will be permanently removed</li>
                                <li style="margin-bottom: 8px;">You will need to create a new account to use our services again</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #0c5460; margin-top: 0;">🤔 Consider These Alternatives:</h4>
                            <ul style="color: #0c5460; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">Temporarily disable your account instead</li>
                                <li style="margin-bottom: 8px;">Export your financial data before deletion</li>
                                <li style="margin-bottom: 8px;">Contact support if you're experiencing issues</li>
                                <li style="margin-bottom: 8px;">Take a break and come back when you're ready</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #721c24; margin-top: 0;">🔒 Didn't Request This?</h4>
                            <p style="color: #721c24; margin-bottom: 10px;">
                                If you did not request account deletion, your account may be compromised. Please:
                            </p>
                            <ul style="color: #721c24; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">Do not enter the verification code</li>
                                <li style="margin-bottom: 8px;">Change your password immediately</li>
                                <li style="margin-bottom: 8px;">Contact our support team</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                            This verification email was sent to {user_mail}. The verification code will expire in 30 minutes. If you have any questions or concerns, please contact our support team at 
                            <a href="mailto:imhoteptech@outlook.com" style="color: #dc3545;">imhoteptech@outlook.com</a>
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                            Imhotep Financial Manager Security Team
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                            We're here to help protect your account and data.
                        </p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            © 2025 Imhotep Financial Manager. All rights reserved.<br>
                            This is an automated security email. Please do not reply.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "⚠️ Account Deletion Verification - Imhotep Financial Manager", body, is_html)
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
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account Deleted - Imhotep Financial Manager</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            👋 Account Successfully Deleted
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Imhotep Financial Manager
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                            <h3 style="color: #0c5460; margin-top: 0; font-size: 18px;">✅ Deletion Complete</h3>
                            <p style="margin-bottom: 0; color: #0c5460;">
                                Your account and all associated data have been permanently removed from our systems.
                            </p>
                        </div>
                        
                        <h2 style="color: #6c757d; margin-bottom: 20px; font-size: 24px;">
                            We're Sorry to See You Go
                        </h2>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Dear Former User,
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Your Imhotep Financial Manager account has been successfully deleted as requested. We understand that everyone's financial management needs are different, and we respect your decision to move on.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #6c757d; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                            <h3 style="color: #6c757d; font-size: 20px; margin: 0; font-weight: bold;">
                                🗑️ Account Deletion Confirmed
                            </h3>
                            <p style="margin: 10px 0 0 0; color: #555; font-size: 14px;">
                                All your data has been permanently removed from our servers
                            </p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #856404; margin-top: 0;">📋 What Was Deleted:</h4>
                            <ul style="color: #856404; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">All financial transactions and records</li>
                                <li style="margin-bottom: 8px;">Personal information and account settings</li>
                                <li style="margin-bottom: 8px;">Financial targets and goals</li>
                                <li style="margin-bottom: 8px;">Wishlist items and preferences</li>
                                <li style="margin-bottom: 8px;">Reports and analytics data</li>
                            </ul>
                        </div>
                        
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px, margin: 25px 0;">
                            <h4 style="color: #155724; margin-top: 0;">💝 Help Us Improve</h4>
                            <p style="color: #155724; margin-bottom: 15px;">
                                We would greatly appreciate your feedback to help us improve our services for future users. Your insights are valuable to us and will help us build a better financial management platform.
                            </p>
                            <div style="text-align: center;">
                                <a href="https://forms.gle/FZVhQXnticjx16228" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">
                                    📝 Share Your Feedback
                                </a>
                            </div>
                        </div>
                        
                        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #0c5460; margin-top: 0;">🔄 Want to Return?</h4>
                            <p style="color: #0c5460; margin-bottom: 10px;">
                                You're always welcome back! If you decide to return to Imhotep Financial Manager in the future:
                            </p>
                            <ul style="color: #0c5460; padding-left: 20px; margin-bottom: 15px;">
                                <li style="margin-bottom: 8px;">Create a new account with the same or different email</li>
                                <li style="margin-bottom: 8px;">Start fresh with new financial goals</li>
                                <li style="margin-bottom: 8px;">Enjoy any new features we've added</li>
                            </ul>
                            <div style="text-align: center;">
                                <a href="https://imhotepf.pythonanywhere.com/register_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">
                                    🚀 Create New Account
                                </a>
                            </div>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                            This final confirmation was sent to {user_mail}. If you have any questions or need assistance with financial management in the future, please don't hesitate to contact our support team at 
                            <a href="mailto:imhoteptech@outlook.com" style="color: #6c757d;">imhoteptech@outlook.com</a>
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                            Imhotep Financial Manager Team
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                            Thank you for being part of our community.
                        </p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            © 2025 Imhotep Financial Manager. All rights reserved.<br>
                            This is an automated confirmation email. Please do not reply.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "👋 Account Deleted - Imhotep Financial Manager", body, is_html)
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

@user_bp.route("/monthly_reports", methods=["GET"])
def monthly_reports():
    if not session.get("logged_in"):
        return redirect("/login_page")
    
    try:
        user_photo_path = select_user_photo()
    except OperationalError:
        error = "Welcome Back"
        return render_template('error.html', error=error, form=CSRFForm())
    
    total_favorite_currency, favorite_currency = show_networth()
    total_favorite_currency = f"{total_favorite_currency:,.2f}"

    user_id = session.get("user_id")
    
    # Get current date
    now = datetime.datetime.now()
    
    # Start date: first day of current month
    start_date = now.replace(day=1).date()
    
    # End date: first day of next month
    if now.month == 12:
        end_date = now.replace(year=now.year + 1, month=1, day=1).date()
    else:
        end_date = now.replace(month=now.month + 1, day=1).date()

    # Debug: Check if there are any transactions in the date range
    total_transactions = db.session.execute(
        text("SELECT COUNT(*) FROM trans WHERE user_id = :user_id AND date >= :start_date AND date < :end_date"),
        {"user_id": user_id, "start_date": start_date, "end_date": end_date}
    ).scalar()
    
    transactions_with_category = db.session.execute(
        text("SELECT COUNT(*) FROM trans WHERE user_id = :user_id AND date >= :start_date AND date < :end_date AND category IS NOT NULL AND category != ''"),
        {"user_id": user_id, "start_date": start_date, "end_date": end_date}
    ).scalar()
    
    print(f"Debug - User ID: {user_id}")
    print(f"Debug - Date range: {start_date} to {end_date}")
    print(f"Debug - Total transactions in range: {total_transactions}")
    print(f"Debug - Transactions with categories: {transactions_with_category}")
    
    # Sample some transactions to check data
    sample_transactions = db.session.execute(
        text("SELECT trans_status, category, amount, currency, date FROM trans WHERE user_id = :user_id AND date >= :start_date AND date < :end_date LIMIT 5"),
        {"user_id": user_id, "start_date": start_date, "end_date": end_date}
    ).fetchall()
    
    print(f"Debug - Sample transactions: {sample_transactions}")
    
    user_withdraw_on_range, user_deposit_on_range = calculate_user_report(start_date, end_date, user_id)
    
    print(f"Debug - Final withdrawals count: {len(user_withdraw_on_range) if user_withdraw_on_range else 0}")
    print(f"Debug - Final deposits count: {len(user_deposit_on_range) if user_deposit_on_range else 0}")
    
    if user_withdraw_on_range:
        print(f"Debug - First withdrawal: {user_withdraw_on_range[0]}")
    if user_deposit_on_range:
        print(f"Debug - First deposit: {user_deposit_on_range[0]}")

    return render_template("monthly_reports.html",
                            user_photo_path=user_photo_path,
                            total_favorite_currency=total_favorite_currency,
                            favorite_currency=favorite_currency,
                            user_withdraw_on_range=user_withdraw_on_range,
                            user_deposit_on_range=user_deposit_on_range,
                            current_month=now.strftime("%B %Y"),
                            form=CSRFForm())

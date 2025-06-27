from flask import session, redirect, render_template, request, Blueprint
from config import CSRFForm, Config
from extensions import db
from utils.user_info import select_user_photo, select_user_data, get_app_currencies
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
    """Handle the personal information settings page, allowing users to view and update their personal information."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't edit the account!" #trial user error
        return redirect("/home")
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session

        if request.method == "GET": #handle get request
            user_username, user_mail, user_photo_path = select_user_data(user_id) #get user data from database
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm()) #render personal info page
        else: #handle post request

            user_username = request.form.get("user_username") #get username from form
            user_mail = request.form.get("user_mail") #get email from form
            user_photo_path = request.form.get("user_photo_path") #get photo path from form

            if "@" in user_username: #validate username format
                error_existing = "username should not have @" #username validation error
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            if "@" not in user_mail: #validate email format
                error_existing = "mail should have @" #email validation error
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            #get current user data from database
            user_username_mail_db = db.session.execute(
                text("SELECT user_mail, user_username FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()

            user_mail_db = user_username_mail_db[0] #get current email from database
            user_username_db = user_username_mail_db[1] #get current username from database

            if user_mail != user_mail_db and user_username != user_username_db: #both email and username changed

                #check if new email already exists
                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()

                #check if new username already exists
                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_mail: #email already taken
                    error_existing = "Mail is already in use. Please choose another one." #email taken error
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                if existing_username: #username already taken
                    error_existing = "Username is already in use. Please choose another one." #username taken error
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                send_verification_mail_code(user_mail) #send verification email for new email
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, form=CSRFForm()) #render email verification page

            if user_mail != user_mail_db: #only email changed
                #check if new email already exists
                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()

                if existing_mail: #email already taken
                    error_existing = "Mail is already in use. Please choose another one. or " #email taken error
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                send_verification_mail_code(user_mail) #send verification email for new email
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, form=CSRFForm()) #render email verification page

            if user_username != user_username_db: #only username changed
                #check if new username already exists
                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_username: #username already taken
                    error_existing = "Username is already in use. Please choose another one. or " #username taken error
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                #update username in database
                db.session.execute(
                    text("UPDATE users SET user_username = :user_username WHERE user_id = :user_id"),
                    {"user_username" :user_username, "user_id":user_id}
                )
                db.session.commit() #commit changes to database
                done = "User Name Changed Successfully!" #success message
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        user_username, user_mail, user_photo_path = select_user_data(user_id) #get updated user data
        return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/personal_info/mail_verification", methods=["POST"])
def mail_verification_change_mail():
    """Handle the mail verification for changing email address."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't delete that account!" #trial user error
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session

        verification_code = request.form.get("verification_code").strip().lower() #get verification code from form
        user_mail = request.form.get("user_mail") #get new email from form
        user_username = request.form.get("user_username") #get username from form
        user_mail_db = request.form.get("user_mail_db") #get old email from form

        if verification_code == session.get("verification_code"): #verify the code
            #update user email and verification status in database
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify, user_mail = :user_mail, user_username = :user_username WHERE user_id = :user_id"),
                {"user_mail_verify" :"verified", "user_mail" :user_mail, "user_username": user_username, "user_id":user_id}
            )
            db.session.commit() #commit changes to database

            is_html = True #set email format to html
            body = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome - Imhotep Financial Manager</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            🎉 Welcome to Your Updated Account
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Imhotep Financial Manager
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                            <h3 style="color: #155724; margin-top: 0; font-size: 18px;">✅ Account Successfully Updated</h3>
                            <p style="margin-bottom: 0; color: #155724;">
                                Your account information has been successfully updated and verified.
                            </p>
                        </div>
                        
                        <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                            Welcome Back, {user_username}!
                        </h2>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Dear {user_username},
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Welcome to Imhotep Financial Manager! Your account has been successfully updated with your new email address. You can now enjoy all the features of our financial management platform.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #51adac; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your New Email</p>
                            <h3 style="color: #51adac; font-size: 20px; margin: 0; font-weight: bold;">
                                {user_mail}
                            </h3>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://imhotepf.pythonanywhere.com/login_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                                🚀 Access Your Dashboard
                            </a>
                        </div>
                        
                        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #0c5460; margin-top: 0;">💡 Getting Started:</h4>
                            <ul style="color: #0c5460; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">Track your income and expenses</li>
                                <li style="margin-bottom: 8px;">Set financial goals and budgets</li>
                                <li style="margin-bottom: 8px;">Monitor your net worth across multiple currencies</li>
                                <li style="margin-bottom: 8px;">Generate detailed financial reports</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                            This welcome email was sent to {user_mail}. If you have any questions or need assistance, please contact our support team at 
                            <a href="mailto:imhoteptech@outlook.com" style="color: #51adac;">imhoteptech@outlook.com</a>
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                            Imhotep Financial Manager Team
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                            Your financial success is our mission.
                        </p>
                        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                            © 2025 Imhotep Financial Manager. All rights reserved.<br>
                            This is an automated welcome email. Please do not reply.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            success, error = send_mail(smtp_server , smtp_port , email_send , email_send_password , user_mail, "🎉 Welcome - Imhotep Financial Manager" ,body, is_html) #send welcome email to new email
            if error:
                print(error) #print error if email sending fails

            done = "User Mail Changed Successfully!" #success message
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
        else:
            error="Invalid verification code." #invalid code error
            return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, error=error, form=CSRFForm())

@settings_bp.route("/settings/personal_info/upload_user_photo", methods=["POST"])
def upload_user_photo():
    """Handle the upload of user profile photo."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't delete that account!" #trial user error
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:

        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session

        photo_path, upload_error = upload_file(request, os.path.join(os.getcwd(), "static", "user_photo"), (".png", ".jpg", ".jpeg"), user_id) #upload photo file

        if upload_error: #check for upload errors
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=upload_error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        photo_name = photo_path.split("/")[-1] #extract photo filename

        #update user photo path in database
        db.session.execute(
            text("UPDATE users SET user_photo_path = :user_photo_path WHERE user_id = :user_id"),
            {"user_photo_path": photo_name, "user_id":user_id}
        )
        db.session.commit() #commit changes to database
        user_username, user_mail, user_photo_path = select_user_data(user_id)
        return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/personal_info/delete_user_photo", methods=["POST"])
def delete_user_photo():
    """Handle the deletion of user profile photo."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't delete that account!" #trial user error
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session
        #get current photo name from database
        photo_name = db.session.execute(
            text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchone()[0]

        if photo_name: #check if user has a photo
            photo_path = os.path.join(Config.UPLOAD_FOLDER_PHOTO, photo_name) #create full photo path

            delete_photo , error = delete_file(photo_path) #delete photo file
            if error: #check for deletion errors
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

            #remove photo path from database
            db.session.execute(
                    text("UPDATE users SET user_photo_path = NULL WHERE user_id = :user_id"),
                    {"user_id" :user_id}
                )
            db.session.commit() #commit changes to database
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
        else:
            error = "No image associated with this user to delete." #no photo error
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

@settings_bp.route("/settings/favorite_currency", methods=["GET", "POST"])
def favorite_currency():
    """Handle the favorite currency settings page, allowing users to view and update their favorite currency."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        user_id = session.get("user_id") #get user id from session
        if request.method == "GET": #handle get request
            favorite_currency = select_favorite_currency(user_id) #get current favorite currency
            total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
            total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
            print(get_app_currencies()) #debug print for available currencies
            return render_template("favorite_currency.html",
                                    favorite_currency=favorite_currency,
                                      user_photo_path=user_photo_path,
                                        total_favorite_currency=total_favorite_currency,
                                          form=CSRFForm(),
                                        currencies_data = get_app_currencies()) #render favorite currency page
        else: #handle post request
            total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
            total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
            favorite_currency = select_favorite_currency(user_id) #get current favorite currency

            favorite_currency = request.form.get("favorite_currency") #get new favorite currency from form

            #update favorite currency in database
            db.session.execute(
                text("UPDATE users SET favorite_currency = :favorite_currency WHERE user_id = :user_id"),
                {"favorite_currency" :favorite_currency, "user_id" :user_id}
            )
            db.session.commit() #commit changes to database

            done = f"Your favorite currency is {favorite_currency} now" #success message
            
            return render_template("favorite_currency.html",
                                    done=done,
                                    favorite_currency=favorite_currency,
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    form=CSRFForm(),
                                    currencies_data = get_app_currencies()
                                    ) #render favorite currency page with success message

@settings_bp.route("/settings/security_check", methods=["POST", "GET"])
def security_check_password():
    """Handle the security check for password settings, allowing users to verify their password before making changes."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't delete that account!" #trial user error
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:
        try:
            user_id = session.get("user_id") #get user id from session
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        if request.method == "GET": #handle get request
            return render_template("check_pass.html", form=CSRFForm()) #render password check page
        else: #handle post request

            user_id = session.get("user_id") #get user id from session
            check_pass = request.form.get("check_pass") #get password from form
            security = security_check(user_id, check_pass) #verify current password

            if security: #password is correct
                return render_template("change_pass.html", user_id = user_id, form=CSRFForm()) #render change password page
            else:
                error = "This password is incorrect!" #incorrect password error
                return render_template("check_pass.html", error = error, form=CSRFForm())

@settings_bp.route("/settings/security", methods=["POST"])
def security():
    """Handle the security settings, allowing users to change their password."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    elif session.get("user_id") == 1: #check if trial user
        error = "this is a trial you can't delete that account!" #trial user error
        return render_template("check_pass_delete_user.html", error=error, form=CSRFForm())
    else:

        user_id = session.get("user_id") #get user id from session
        new_password = request.form.get("new_password") #get new password from form

        #get user email for notification
        user_mail = db.session.execute(
            text("SELECT user_mail FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchone()[0]

        hashed_password = generate_password_hash(new_password) #hash new password
        #update password in database
        db.session.execute(
            text("UPDATE users SET user_password = :user_password WHERE user_id = :user_id"),
            {"user_password" :hashed_password, "user_id" :user_id}
        )
        db.session.commit() #commit changes to database

        is_html = True #set email format to html
        body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed - Imhotep Financial Manager</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                        🔐 Password Successfully Changed
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                        Imhotep Financial Manager Security
                    </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <h3 style="color: #155724; margin-top: 0; font-size: 18px;">✅ Password Update Successful</h3>
                        <p style="margin-bottom: 0; color: #155724;">
                            Your password has been successfully changed and your account is now more secure.
                        </p>
                    </div>
                    
                    <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                        Password Changed Successfully
                    </h2>
                    
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                        Dear User,
                    </p>
                    
                    <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                        This email confirms that your password has been successfully changed for your Imhotep Financial Manager account. Your account security has been updated and you can continue using our platform with confidence.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #51adac; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                        <h3 style="color: #51adac; font-size: 20px; margin: 0; font-weight: bold;">
                            🛡️ Your Account is Now More Secure
                        </h3>
                        <p style="margin: 10px 0 0 0; color: #555; font-size: 14px;">
                            Password updated successfully at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://imhotepf.pythonanywhere.com/login_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                            🚀 Access Your Dashboard
                        </a>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h4 style="color: #856404; margin-top: 0;">🔐 Security Reminders:</h4>
                        <ul style="color: #856404; padding-left: 20px; margin-bottom: 0;">
                            <li style="margin-bottom: 8px;">Keep your new password secure and never share it with anyone</li>
                            <li style="margin-bottom: 8px;">Use your new password for all future logins</li>
                            <li style="margin-bottom: 8px;">Consider enabling two-factor authentication for added security</li>
                            <li style="margin-bottom: 8px;">If you didn't make this change, contact support immediately</li>
                        </ul>
                    </div>
                    
                    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h4 style="color: #721c24; margin-top: 0;">⚠️ Didn't Change Your Password?</h4>
                        <p style="color: #721c24; margin-bottom: 10px;">
                            If you did not request this password change, your account may be compromised. Please contact our support team immediately.
                        </p>
                        <p style="color: #721c24; margin-bottom: 0;">
                            <strong>Support Email:</strong> <a href="mailto:imhoteptech@outlook.com" style="color: #721c24;">imhoteptech@outlook.com</a>
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                        This security notification was sent to {user_mail}. For your protection, we automatically log you out of all devices when your password is changed. If you have any questions or concerns, please contact our support team.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #2f5a5a; color: #ffffff; padding: 25px 30px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                        Imhotep Financial Manager Security Team
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
                        Protecting your financial data is our top priority.
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
        success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "🔐 Password Changed - Imhotep Financial Manager", body, is_html) #send password change notification
        if error:
            print(error) #print error if email sending fails

        logout() #log out user for security
        success = "You password has been changed successfully!" #success message
        return render_template("login.html", success = success, form=CSRFForm())

@settings_bp.route("/settings/set_target", methods=["GET","POST"])
def set_target():
    """Handle the target settings page, allowing users to set and update their financial target."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session
        if request.method == "GET": #handle get request
            now = datetime.now() #get current date
            mounth = now.month #get current month
            year = now.year #get current year
            #check if target exists for current month and year
            target_db = db.session.execute(
                text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id" :user_id, "mounth" : mounth, "year":year}
            ).fetchall()
            if target_db: #target exists
                target_db = target_db[0] #get target data
                return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, target_db=target_db, form=CSRFForm()) #render update target page
            else: #no target exists
                return render_template("set_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, form=CSRFForm()) #render set target page
        else: #handle post request

            target = request.form.get("target") #get target amount from form

            now = datetime.now() #get current date
            mounth = now.month #get current month
            year = now.year #get current year

            #get the last target id in the database
            try:
                last_target_id = db.session.execute(
                        text("SELECT MAX(target_id) FROM target")
                    ).fetchone()[0]
                target_id = last_target_id + 1 #increment for new target
            except:
                target_id = 1 #first target in database

            #insert new target into database
            db.session.execute(
                text("INSERT INTO target (target_id, user_id, target, mounth, year) VALUES (:target_id, :user_id, :target, :mounth, :year)"),
                {"target_id":target_id, "user_id" :user_id, "target": target, "mounth" :mounth, "year" :year}
            )
            db.session.commit() #commit changes to database
            done = "Your Target have been set" #success message
            #get newly created target data
            target_db = db.session.execute(
                text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id" :user_id, "mounth" : mounth, "year":year}
            ).fetchall()[0]
            return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target=target, target_db=target_db, form=CSRFForm()) #render update target page with success

@settings_bp.route("/settings/update_target", methods=["POST"])
def update_target():
    """Handle the update of financial target settings."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
        user_id = session.get("user_id") #get user id from session

        target = request.form.get("target") #get new target amount from form

        now = datetime.now() #get current date
        mounth = now.month #get current month
        year = now.year #get current year

        #get target id for current month and year
        target_id = db.session.execute(
                text("SELECT target_id FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id": user_id, "mounth": mounth, "year":year}
            ).fetchone()[0]

        #update target in database
        db.session.execute(
            text("UPDATE target SET target = :target WHERE target_id = :target_id"),
            {"target_id":target_id, "target": target}
        )
        db.session.commit() #commit changes to database

        #get updated target data
        target_db = db.session.execute(
            text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
            {"user_id" :user_id, "mounth" : mounth, "year":year}
        ).fetchall()[0]

        done = "Your Target have been updated" #success message
        return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target_db=target_db, form=CSRFForm()) #render update target page with success


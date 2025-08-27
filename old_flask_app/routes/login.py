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
    """Render the login page or redirect to home if already logged in."""
    if session.get("logged_in"): #check if user is already logged in
        return redirect("/home") #redirect to home if already logged in
    else:
        return render_template("login.html", form=CSRFForm()) #render login page

@login_bp.route("/trial_login", methods=["POST"])
def trial_login():
    """Log in a test user and redirect to home."""
    # Assuming the test user has user_id = 1
    test_user_id = 1 #set test user id
    session["logged_in"] = True #set logged in status
    session["user_id"] = test_user_id #set user id in session
    session.permanent = True #make session permanent
    return redirect("/home") #redirect to home page

@login_bp.route("/login", methods=["POST"])
#@limiter.limit("3 per minute")
def login():
    """Log in a user with given username/email and password."""
    user_username_mail = (request.form.get("user_username_mail").strip()).lower() #get username or email from form
    user_password = request.form.get("user_password") #get password from form

    if "@" in user_username_mail: #check if input is email
        try:
            #get password and verification status from database using email
            login_db = db.session.execute(
            text("SELECT user_password, user_mail_verify FROM users WHERE LOWER(user_mail) = :user_mail"),
            {"user_mail": user_username_mail}
            ).fetchall()[0]

            password_db = login_db[0] #get hashed password from database
            user_mail_verify = login_db[1] #get email verification status

            if check_password_hash(password_db, user_password): #verify password
                if user_mail_verify == "verified": #check if email is verified
                    #get user id for verified user
                    user = db.session.execute(
                        text("SELECT user_id FROM users WHERE LOWER(user_mail) = :user_mail AND user_password = :user_password"),
                        {"user_mail": user_username_mail, "user_password": password_db}
                    ).fetchone()[0]

                    #log in the user
                    session["logged_in"] = True
                    session["user_id"] = user
                    session.permanent = True
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified" #email not verified error
                    return render_template("login.html", error_verify=error_verify, form=CSRFForm())
            else:
                error = "Your username or password are incorrect!" #incorrect password error
                return render_template("login.html", error=error, form=CSRFForm())
        except:
            error = "Your E-mail or password are incorrect!" #email not found error
            return render_template("login.html", error=error, form=CSRFForm())
    else: #input is username
        try:
            #get password and verification status from database using username
            login_db = db.session.execute(
                    text("SELECT user_password, user_mail_verify FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username_mail}
                ).fetchall()[0]
            password_db = login_db[0] #get hashed password from database
            user_mail_verify = login_db[1] #get email verification status

            if check_password_hash(password_db, user_password): #verify password
                if user_mail_verify == "verified": #check if email is verified
                    #get user id for verified user
                    user = db.session.execute(
                        text("SELECT user_id FROM users WHERE LOWER(user_username) = :user_username AND user_password = :user_password"),
                        {"user_username": user_username_mail, "user_password": password_db}
                    ).fetchone()[0]

                    #log in the user
                    session["logged_in"] = True
                    session["user_id"] = user
                    session.permanent = True
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified" #email not verified error
                    return render_template("login.html", error_verify=error_verify, form=CSRFForm())
            else:
                error = "Your username or password are incorrect!" #incorrect password error
                return render_template("login.html", error=error, form=CSRFForm())
        except:
            error = "Your username or password are incorrect!" #username not found error
            return render_template("login.html", error=error, form=CSRFForm())

@login_bp.route("/manual_mail_verification", methods=["POST", "GET"])
def manual_mail_verification():
    """Render the manual mail verification page or send a verification email."""
    if request.method == "GET": #handle get request
        return render_template("manual_mail_verification.html", form=CSRFForm()) #render verification page
    else: #handle post request
        user_mail = (request.form.get("user_mail").strip()).lower() #get email from form
        try:
            #get user id and verification status from database
            mail_verify_db = db.session.execute(
                text("SELECT user_id, user_mail_verify FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
                ).fetchall()[0]
            user_id = mail_verify_db[0] #get user id
            mail_verify = mail_verify_db[1] #get verification status
        except:
            error_not = "This mail isn't used on the webapp!" #email not found error
            return render_template("manual_mail_verification.html", error_not = error_not, form=CSRFForm())

        if mail_verify == "verified": #check if already verified
            error = "This Mail is already used and verified" #already verified error
            return render_template("login.html", error=error, form=CSRFForm())
        else:
            session["user_id"] = user_id #store user id in session
            send_verification_mail_code(user_mail) #send verification email
            return render_template("mail_verify.html", form=CSRFForm()) #render verification page

@login_bp.route("/forget_password",methods=["POST", "GET"])
def forget_password():
    """Render the forget password page or send a password reset email."""
    if request.method == "GET": #handle get request
        return render_template("forget_password.html", form=CSRFForm()) #render forget password page
    else: #handle post request

        user_mail = request.form.get("user_mail") #get email from form
        try:
            #check if email exists in database
            db.session.execute(
                text("SELECT user_mail FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
            ).fetchall()[0]

            temp_password = secrets.token_hex(4) #generate temporary password
            is_html = True #set email format to html
            body = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset - Imhotep Financial Manager</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            🔐 Password Reset Request
                        </h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Imhotep Financial Manager Security
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                            <h3 style="color: #856404; margin-top: 0; font-size: 18px;">⚠️ Security Alert</h3>
                            <p style="margin-bottom: 0; color: #856404;">
                                We received a request to reset your password. If you didn't make this request, please contact our support team immediately.
                            </p>
                        </div>
                        
                        <h2 style="color: #51adac; margin-bottom: 20px; font-size: 24px;">
                            Your Temporary Password
                        </h2>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Dear User,
                        </p>
                        
                        <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
                            Use the temporary password below to log in to your account. For your security, please change this password immediately after logging in.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed #51adac; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
                            <h1 style="color: #51adac; font-family: 'Courier New', monospace; font-size: 32px; margin: 0; letter-spacing: 3px; font-weight: bold;">
                                {temp_password}
                            </h1>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://imhotepf.pythonanywhere.com/login_page" style="background: linear-gradient(135deg, #51adac 0%, #428a89 100%); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                                🔑 Login to Your Account
                            </a>
                        </div>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h4 style="color: #721c24; margin-top: 0;">🚨 Important Security Instructions:</h4>
                            <ul style="color: #721c24; padding-left: 20px; margin-bottom: 0;">
                                <li style="margin-bottom: 8px;">This temporary password expires in 24 hours</li>
                                <li style="margin-bottom: 8px;">Change your password immediately after logging in</li>
                                <li style="margin-bottom: 8px;">Never share this password with anyone</li>
                                <li style="margin-bottom: 8px;">If you didn't request this, contact support immediately</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
                            This email was sent to {user_mail}. If you have any questions or concerns, please contact our support team at 
                            <a href="mailto:imhoteptech@outlook.com" style="color: #51adac;">imhoteptech@outlook.com</a>
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
            """ #password reset email html template
            success, error = send_mail(smtp_server, smtp_port, email_send, email_send_password, user_mail, "🔐 Password Reset - Imhotep Financial Manager", body, is_html) #send password reset email
            if error:
                print(error) #print error if email sending fails

            hashed_password = generate_password_hash(temp_password) #hash temporary password
            #update user password in database
            db.session.execute(
                text("UPDATE users SET user_password = :user_password WHERE user_mail = :user_mail"), {"user_password" :hashed_password, "user_mail": user_mail}
                )
            db.session.commit() #commit changes to database

            success="The Mail is sent check Your mail for your new password" #success message
            return render_template("login.html", success=success, form=CSRFForm())
        except:
            error = "This Email isn't saved" #email not found error
            return render_template("forget_password.html", error = error, form=CSRFForm())

@login_bp.route("/logout", methods=["GET", "POST"])
def logout_route():
        """Log out the user and redirect to the login page."""
        logout() #clear session data
        return redirect("/login_page") #redirect to login page

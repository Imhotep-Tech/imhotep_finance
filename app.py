from flask import render_template, redirect, Flask, session, request
from flask_mail import Mail, Message
from cs50 import SQL
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

app = Flask(__name__)

secret_key = secrets.token_hex(16)
app.config['SECRET_KEY'] = secret_key

app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'imhotepfinance@gmail.com'
app.config['MAIL_PASSWORD'] = "hrsw vzhz cixd eecs"
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

mail = Mail(app)

db = SQL("sqlite:///imhotepfinance.db")

def verify_mail(verification_code):
    if verification_code == session.get("verification_code"):
            db.execute("UPDATE users SET user_mail_verify = ?", "verified")
            success = "Email verified successfully. You can now log in."
            return 1
    else:
        return 0
    
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/login_page", methods=["GET"])
def login_page():
    if session.get("logged_in"):
        return redirect("/home")
    elif session.get("logged_in_admin"):
        return redirect("/admin_home")
    elif session.get("logged_in_assistant"):
        return redirect("/assistant_home")
    else:
        return render_template("login.html")

@app.route("/register_page", methods=["GET"])
def register_page():
    return render_template("register.html")

@app.route("/register", methods=["POST"])
def register():
        user_username = (request.form.get("user_username").strip()).lower()
        user_password = request.form.get("user_password")
        user_name = request.form.get("user_name")
        user_mail = request.form.get("user_mail")

        existing_username = db.execute("SELECT user_username FROM users WHERE LOWER(user_username) = ? ", user_username)
        if len(existing_username) > 0:
            error_existing = "Username is already in use. Please choose another one. or "
            return render_template("register.html", error=error_existing)

        existing_mail = db.execute("SELECT user_mail FROM users WHERE LOWER(user_mail) = ? ", user_mail)
        if len(existing_mail) > 0:
            error_existing = "Mail is already in use. Please choose another one. or "
            return render_template("register.html", error=error_existing)
        
        verification_code = secrets.token_hex(4)
        msg = Message('Email Verification', sender = 'imhotepfinance@gmail.com', recipients = [user_mail])
        msg.body = f"Your verification code is: {verification_code}"
        mail.send(msg)

        session["verification_code"] = verification_code
        hashed_password = generate_password_hash(user_password)
        
        db.execute("INSERT INTO users (user_username, user_password, user_name, user_mail, user_mail_verify) VALUES (?,?,?,?,?)", user_username, hashed_password, user_name, user_mail, "not_verified")
        return render_template("mail_verify.html")

@app.route("/mail_verification", methods=["POST", "GET"])
def mail_verification():
    if request.method == "GET":
        return render_template("mail_verify.html")
    else: 
        verification_code = request.form.get("verification_code").strip()

        if verification_code == session.get("verification_code"):
            db.execute("UPDATE users SET user_mail_verify = ?", "verified")
            success="Email verified successfully. You can now log in."
            return render_template("login.html", success=success)
        
        else:
            error="Invalid verification code."
            return render_template("mail_verify.html", error=error)
    
@app.route("/login", methods=["POST"])
def login():
    user_username = (request.form.get("user_username").strip()).lower()
    user_password = request.form.get("user_password")

    login_db = db.execute("SELECT user_password, user_mail_verify FROM users WHERE LOWER(user_username) = ? AND user_mail_verify = ?", user_username, "verified")
    if len(login_db) > 0:
        password_db = login_db[0]["user_password"]
        user_mail_verify = login_db[0]["user_mail_verify"]

        if login_db and check_password_hash(password_db, user_password):
            if user_mail_verify == "verified":
                user = db.execute("SELECT user_id FROM users WHERE LOWER(user_username) = ? AND user_password = ?", user_username, password_db)
                session["logged_in"] = True
                session["user_id"] = user[0]["user_id"]
                return redirect("/home")
            else:
                error = "Your mail isn't verified"
                return render_template("login.html", error = error)
        else:
            error = "Your username or password are incorrect!"
            return render_template("login.html", error = error)
    else:
        error = "Your username is incorrect!"
        return render_template("login.html", error = error)

@app.route("/logout", methods=["GET", "POST"])
def logout():
        session.permanent = False
        session["logged_in"] = False
        return redirect("/login_page")

@app.route("/home", methods=["GET"])
def home():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        return render_template("home.html")
    

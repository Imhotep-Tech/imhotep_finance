from flask import render_template, redirect, Flask, session, request
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from sqlalchemy import text

app = Flask(__name__)

secret_key = secrets.token_hex(16)
app.config['SECRET_KEY'] = secret_key

app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'imhotepfinance@gmail.com'
app.config['MAIL_PASSWORD'] = "hrsw vzhz cixd eecs"
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://kbassem:2005@localhost/imhotepfinance'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

mail = Mail(app)
    
def send_verification_mail_code(user_mail):
    verification_code = secrets.token_hex(4)
    msg = Message('Email Verification', sender='imhotepfinance@gmail.com', recipients=[user_mail])
    msg.body = f"Your verification code is: {verification_code}"
    mail.send(msg)

    session["verification_code"] = verification_code

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
    user_mail = request.form.get("user_mail").lower()

    existing_username = db.session.execute(
        text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
        {"user_username": user_username}
    ).fetchall()
    if existing_username:
        error_existing = "Username is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing)

    existing_mail = db.session.execute(
        text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
        {"user_mail": user_mail}
    ).fetchall()
    if existing_mail:
        error_existing = "Mail is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing)

    last_user_id = db.session.execute(
        text("SELECT MAX(user_id) FROM users")
    ).fetchone()[0]
    user_id = last_user_id + 1

    session["user_id"] = user_id
    hashed_password = generate_password_hash(user_password)

    send_verification_mail_code(user_mail)

    db.session.execute(
        text("INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify) VALUES (:user_id, :user_username, :user_password, :user_mail, :user_mail_verify)"),
        {"user_id": user_id ,"user_username": user_username, "user_password": hashed_password, "user_mail": user_mail, "user_mail_verify": "not_verified"}
    )
    db.session.commit()

    return render_template("mail_verify.html")
@app.route("/mail_verification", methods=["POST", "GET"])
def mail_verification():
    if request.method == "GET":
        return render_template("mail_verify.html")
    else: 
        verification_code = request.form.get("verification_code").strip()
        user_id = session.get("user_id")
        if verification_code == session.get("verification_code"):
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify WHERE user_id = :user_id"), {"user_mail_verify" :"verified", "user_id": user_id}
                )
            db.session.commit()
            success="Email verified successfully. You can now log in."
            return render_template("login.html", success=success)
        
        else:
            error="Invalid verification code."
            return render_template("mail_verify.html", error=error)
    
@app.route("/login", methods=["POST"])
def login():
    user_username_mail = (request.form.get("user_username_mail").strip()).lower()
    user_password = request.form.get("user_password")

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
                
                return redirect("/home")
            else:
                error_verify = "Your mail isn't verified"
                return render_template("login.html", error_verify=error_verify)
        else:
            error = "Your username or password are incorrect!"
            return render_template("login.html", error=error)
    except:
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
                    
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified"
                    return render_template("login.html", error_verify=error_verify)
            else:
                error = "Your username or password are incorrect!"
                return render_template("login.html", error=error)
        except:
            
            error = "Your username is incorrect!"
            return render_template("login.html", error=error)

@app.route("/manual_mail_verification", methods=["POST", "GET"])
def manual_mail_verification():
    if request.method == "GET":
        return render_template("manual_mail_verification.html")
    else: 
        user_mail = (request.form.get("user_mail").strip()).lower()
        mail_verify_db = db.session.execute(
            text("SELECT user_id, user_mail_verify FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
            ).fetchall()[0]
        user_id = mail_verify_db[0]
        mail_verify = mail_verify_db[1]
        if mail_verify == "verified":
            error = "This Mail is already used and verified"
            return render_template("login.html", error=error)
        else:
            session["user_id"] = user_id
            send_verification_mail_code(user_mail)
            return render_template("mail_verify.html")

@app.route("/forget_password",methods=["POST", "GET"])
def forget_password():
    if request.method == "GET":
        return render_template("forget_password.html")
    else:
        user_mail = request.form.get("user_mail")
        try:
            db.session.execute(
                text("SELECT user_mail FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
            ).fetchall()[0]

            temp_password = secrets.token_hex(4)
            msg = Message('Reset Password', sender='imhotepfinance@gmail.com', recipients=[user_mail])
            msg.body = f"Your temporary Password is: {temp_password}"
            mail.send(msg)
            
            hashed_password = generate_password_hash(temp_password)
            db.session.execute(
                text("UPDATE users SET user_password = :user_password WHERE user_mail = :user_mail"), {"user_password" :hashed_password, "user_mail": user_mail}
                )
            db.session.commit()

            success="The Mail is sent check Your mail for your new password"
            return render_template("login.html", success=success)
        except:
            error = "This Email isn't saved"
            return render_template("forget_password.html", error = error)

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


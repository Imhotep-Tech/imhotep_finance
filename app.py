from flask import render_template, redirect, Flask, session, request
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from sqlalchemy import text
import requests

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

def show_networth():
    user_id = session.get("user_id")
    favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchone()[0]

    total_db = db.session.execute(
        text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchall()

    total_db_dict = dict(total_db)

    response = requests.get(f"https://v6.exchangerate-api.com/v6/7d7b7d6ff63abda67e3e5cc3/latest/{favorite_currency}")
    data = response.json()
    rate = data["conversion_rates"]
    total_favorite_currency = 0

    for currency, amount in total_db_dict.items():
        converted_amount = amount / rate[currency]
        total_favorite_currency += converted_amount

    return total_favorite_currency, favorite_currency

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
        text("INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency) VALUES (:user_id, :user_username, :user_password, :user_mail, :user_mail_verify, :favorite_currency)"),
        {"user_id": user_id ,"user_username": user_username, "user_password": hashed_password, "user_mail": user_mail, "user_mail_verify": "not_verified", "favorite_currency": "USD"}
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
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency)
    
@app.route("/withdraw", methods=["POST", "GET"])
def withdraw():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.method == "GET":
            return render_template("withdraw.html")
        else:
            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            
            last_trans_id = db.session.execute(
                    text("SELECT MAX(trans_id) FROM trans")
                ).fetchone()[0]
            trans_id = last_trans_id + 1

            last_networth_id = db.session.execute(
                    text("SELECT MAX(networth_id) FROM networth")
                ).fetchone()[0]
            networth_id = last_networth_id + 1

            db.session.execute(
                text("INSERT INTO trans (date, amount, currency, user_id, trans_id, trans_status) VALUES (:date, :amount, :currency, :user_id, :trans_id, :trans_status)"),
                  {"date": date, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "withdraw"}
            )
            db.session.commit()


            try:
                networth_db = db.session.execute(
                    text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                    {"user_id": user_id, "currency": currency}
                ).fetchone()
                print(networth_db)
                networth_id = networth_db[0]
                total = int(networth_db[1])

                print(total)
                print(type(total))

                new_total = total - amount
                db.session.execute(
                    text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"), 
                    {"total" :new_total, "networth_id": networth_id}
                )
                db.session.commit()

            except:
                error = "You don't have money from that currency!"
            return redirect("/home")

@app.route("/deposit", methods=["POST", "GET"])
def deposit():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.method == "GET":
            return render_template("deposit.html")
        else:
            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            
            last_trans_id = db.session.execute(
                    text("SELECT MAX(trans_id) FROM trans")
                ).fetchone()[0]
            trans_id = last_trans_id + 1

            last_networth_id = db.session.execute(
                    text("SELECT MAX(networth_id) FROM networth")
                ).fetchone()[0]
            networth_id = last_networth_id + 1

            db.session.execute(
                text("INSERT INTO trans (date, amount, currency, user_id, trans_id, trans_status) VALUES (:date, :amount, :currency, :user_id, :trans_id, :trans_status)"),
                  {"date": date, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "deposit"}
            )
            db.session.commit()

            networth_db = db.session.execute(
                text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id": user_id, "currency": currency}
            ).fetchone()

            if networth_db:
                networth_id = networth_db[0]
                total = int(networth_db[1])

                new_total = total + amount
                db.session.execute(
                    text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"), 
                    {"total" :new_total, "networth_id": networth_id}
                )
                db.session.commit()

            else:
                db.session.execute(
                    text("INSERT INTO networth (networth_id,  user_id , currency, total) VALUES (:networth_id,  :user_id , :currency, :total)"),
                    {"networth_id": networth_id, "user_id": user_id, "currency": currency, "total": amount}
                )
                db.session.commit()

            return redirect("/home")

@app.route("/show_networth_details", methods=["GET"])
def show_networth_details():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        networth_details_db = db.session.execute(
            text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        networth_details = dict(networth_details_db)
        return render_template("networth_details.html", networth_details=networth_details)
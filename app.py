from flask import render_template, redirect, Flask, session, request, make_response
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from sqlalchemy import text
import requests
from werkzeug.utils import secure_filename
import os
import datetime
from datetime import date, timedelta
from sqlalchemy.exc import OperationalError
from flask_session import Session
import google.generativeai as genai

#define the app
app = Flask(__name__)
#define a secret key with a hexadecimal number of 16 digit
secret_key = secrets.token_hex(16)
app.config['SECRET_KEY'] = secret_key
app.permanent_session_lifetime = timedelta(days=30)
app.config['SESSION_TYPE'] = 'filesystem'
sess = Session(app)

#define the mail to send the verification code and the forget password
app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'imhotepfinance@gmail.com'
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
mail = Mail(app)

#connection with the database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

#define the place to save the user photo and the allowed image formats
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024
app.config["UPLOAD_FOLDER_PHOTO"] = os.path.join(os.getcwd(), "static", "user_photo")
ALLOWED_EXTENSIONS = ("png", "jpg", "jpeg")

def send_verification_mail_code(user_mail):
    verification_code = secrets.token_hex(4)
    msg = Message('Email Verification', sender='imhotepfinance@gmail.com', recipients=[user_mail])
    msg.body = f"Your verification code is: {verification_code}"
    mail.send(msg)

    session["verification_code"] = verification_code

def set_currency_session(favorite_currency):
    primary_api_key = os.getenv('EXCHANGE_API_KEY_PRIMARY')
    secondary_api_key = os.getenv('EXCHANGE_API_KEY_SECONDARY')
    third_api_key = os.getenv('EXCHANGE_API_KEY_THIRD')
    
    data = None
    try:
        response = requests.get(f"https://v6.exchangerate-api.com/v6/{primary_api_key}/latest/{favorite_currency}")
        data = response.json()
        rate = data["conversion_rates"]
    except:
        try:
            response = requests.get(f"https://v6.exchangerate-api.com/v6/{secondary_api_key}/latest/{favorite_currency}")
            data = response.json()
            rate = data["conversion_rates"]
        except:
            try:
                response = requests.get(f"https://v6.exchangerate-api.com/v6/{third_api_key}/latest/{favorite_currency}")
                data = response.json()
                rate = data["conversion_rates"]
            except requests.RequestException as e:
                print(f"Failed to fetch exchange rates: {e}")
                return None

    if rate:
        session["rate"] = rate
        tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).date()
        session["rate_expire"] = tomorrow
        return rate
    return None

def convert_to_fav_currency(dictionary, user_id):
        favorite_currency = select_favorite_currency(user_id)
        today = datetime.datetime.now().date()
        if session.get('rate_expire') == today:

            session.pop('rate', None)
            session.pop('rate_expire', None)

            rate = set_currency_session(favorite_currency)
            if not rate:
                return None, favorite_currency
        else:
            rate = session.get('rate')
            if rate == None:
                try:
                    rate = set_currency_session(favorite_currency)
                except:
                    return "Error"
        
        total_favorite_currency = 0

        for currency, amount in dictionary.items():
            converted_amount = amount / rate[currency]
            total_favorite_currency += converted_amount

        return total_favorite_currency, favorite_currency

def show_networth():
    user_id = session.get("user_id")
    favorite_currency = select_favorite_currency(user_id)

    total_db = db.session.execute(
        text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchall()

    total_db_dict = dict(total_db)

    total_favorite_currency,favorite_currency = convert_to_fav_currency(total_db_dict, user_id)

    return total_favorite_currency, favorite_currency

def select_currencies(user_id):
    currency_db = db.session.execute(
        text("SELECT currency from networth WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchall()

    currency_all = []
    for item in currency_db:
        currency_all.append(item[0])

    return(currency_all)

def allowed_file(filename):
    if "." in filename:
        filename_check = filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
        return filename_check
    else:
        return False

#a function that seperate the file extention form the filename by spliting it after the . and selects the index [1]
def file_ext(filename):
        if "." in filename:
                file_ext = filename.split('.', 1)[1].lower()
        return file_ext

def select_user_data(user_id):
        user_info = db.session.execute(
        text("SELECT user_username, user_mail, user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()[0]

        user_username = user_info[0]
        user_mail = user_info[1]
        user_photo_path = user_info[2]
        return user_username, user_mail, user_photo_path

def select_user_photo():
    user_id = session.get("user_id")
    user_photo_path = db.session.execute(
        text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchone()[0]
    return user_photo_path

def delete_photo(user_id, photo_path):
        if os.path.exists(photo_path):
                os.remove(photo_path)
                db.session.execute(
                    text("UPDATE users SET user_photo_path = NULL WHERE user_id = :user_id"),
                    {"user_id" :user_id}
                )
                db.session.commit()
        else:
            error = "No image associated with this doctor to delete."
            return error

def select_favorite_currency(user_id):
        favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id" :user_id}
        ).fetchone()[0]
        return favorite_currency

def select_years_wishlist(user_id):
        all_years_db = db.session.execute(
            text("SELECT DISTINCT(year) FROM wishlist WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchall()

        all_years = []
        for item in all_years_db:
            all_years.append(item[0])

        return all_years

def wishlist_page(user_id):
        today = date.today()
        year = today.year

        wishlist_db = db.session.execute(
            text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
            {"user_id" :user_id , "year" :year}
        ).fetchall()

        return year, wishlist_db

def logout():
        session.permanent = False
        session["logged_in"] = False
        session.pop('rate', None)
        session.pop('rate_expire', None)
        session.clear()

def security_check(user_id, check_pass):
    password_db = db.session.execute(
                text("SELECT user_password FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()[0]

    if check_password_hash(password_db, check_pass):
        return True
    else:
        return False

'''def query_gemini(prompt, user_data):
    enriched_prompt = prompt
    if user_data:
        enriched_prompt = f"User data: {user_data}\n{prompt}"

    response = chat_session.send_message(enriched_prompt)
    print(response.text)
    return response.text

def get_user_data(user_id):
    trans_db = db.session.execute(
        text("SELECT currency, date, amount, trans_status, trans_details FROM trans WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    target_db = db.session.execute(
        text("SELECT target, mounth, year FROM target WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    wishlist_db = db.session.execute(
        text("SELECT currency, price, status, link, wish_details, year FROM wishlist WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    networth_db = db.session.execute(
        text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    print(user_id)
    favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchone()[0]
    print(favorite_currency)
    user_data = {
        'transactions': [{'currency': row[0], 'date': row[1].strftime('%Y-%m-%d'), 'amount': float(row[2]), 'trans_status': row[3], 'trans_details': row[4] } for row in trans_db],
        'user_save_target': [{'target': row[0], 'mounth': row[1], 'year': row[2]} for row in target_db],
        'wishlist': [{'currency': row[0], 'price': row[1], 'status': row[2], 'link': row[3], 'wish_details': row[4], 'year': row[5]} for row in wishlist_db],
        'networth': [{'currency': row[0], 'total': row[1]} for row in networth_db],
        'favorite_currency': favorite_currency,
        }
    return user_data'''

@app.route("/", methods=["GET"])
def index():
    session["secret_key"] = secret_key
    return redirect("/login_page")

@app.route("/login_page", methods=["GET"])
def login_page():
    if session.get("logged_in"):
        return redirect("/home")
    else:
        session["secret_key"] = secret_key
        return render_template("login.html", secret_key=secret_key)

@app.route("/register_page", methods=["GET"])
def register_page():
    session["secret_key"] = secret_key
    return render_template("register.html", secret_key=secret_key)

@app.route("/register", methods=["POST"])
def register():
    if request.form.get("secret_key") != session.get('secret_key'):
        error_existing = "Cookies are blocked, please enable cookies from your browser settings"
        return render_template("register.html", error_existing=error_existing, secret_key=secret_key), 400, logout()

    user_username = (request.form.get("user_username").strip()).lower()
    user_password = request.form.get("user_password")
    user_mail = request.form.get("user_mail").lower()

    if "@" in user_username:
        error = "username should not have @"
        return render_template("register.html", error=error, secret_key=secret_key)

    if "@" not in user_mail:
        error = "mail should have @"
        return render_template("register.html", error=error, secret_key=secret_key)

    existing_username = db.session.execute(
        text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
        {"user_username": user_username}
    ).fetchall()
    if existing_username:
        error_existing = "Username is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing, secret_key=secret_key)

    existing_mail = db.session.execute(
        text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
        {"user_mail": user_mail}
    ).fetchall()
    if existing_mail:
        error_existing = "Mail is already in use. Please choose another one. or "
        return render_template("register.html", error=error_existing, secret_key=secret_key)

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

    return render_template("mail_verify.html", user_mail=user_mail, user_username=user_username, secret_key=secret_key)

@app.route("/mail_verification", methods=["POST", "GET"])
def mail_verification():
    if request.method == "GET":
        return render_template("mail_verify.html")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return render_template("mail_verify.html", error=error, secret_key=secret_key), 400

        verification_code = request.form.get("verification_code").strip()
        user_id = session.get("user_id")
        user_mail = request.form.get("user_mail")
        user_username = request.form.get("user_username")
        if verification_code == session.get("verification_code"):
            db.session.execute(
                text("UPDATE users SET user_mail_verify = :user_mail_verify WHERE user_id = :user_id"), {"user_mail_verify" :"verified", "user_id": user_id}
                )
            db.session.commit()

            msg = Message('Email Changed', sender='imhotepfinance@gmail.com', recipients=[user_mail])
            msg.body = f"Welcome {user_username} To Imhotep Finacial Manager"
            mail.send(msg)

            success="Email verified successfully. You can now log in."
            return render_template("login.html", success=success, secret_key=secret_key)

        else:
            error="Invalid verification code."
            return render_template("mail_verify.html", error=error, secret_key=secret_key)

@app.route("/login", methods=["POST"])
def login():
    if request.form.get("secret_key") != session.get('secret_key'):
        error = "Cookies are blocked, please enable cookies from your browser settings"
        return render_template("login.html", error=error, secret_key=secret_key), 400

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
                    return render_template("login.html", error_verify=error_verify, secret_key=secret_key)
            else:
                error = "Your username or password are incorrect!"
                return render_template("login.html", error=error, secret_key=secret_key)
        except:
            error = "Your E-mail or password are incorrect!"
            return render_template("login.html", error=error, secret_key=secret_key)
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
                    session["secret_key"] = secret_key
                    session["user_id"] = user
                    session.permanent = True
                    return redirect("/home")
                else:
                    error_verify = "Your mail isn't verified"
                    return render_template("login.html", error_verify=error_verify, secret_key=secret_key)
            else:
                error = "Your username or password are incorrect!"
                return render_template("login.html", error=error, secret_key=secret_key)
        except:
            error = "Your username or password are incorrect!"
            return render_template("login.html", error=error, secret_key=secret_key)

@app.route("/manual_mail_verification", methods=["POST", "GET"])
def manual_mail_verification():
    if request.method == "GET":
        return render_template("manual_mail_verification.html")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return render_template("login.html", error=error), 400

        user_mail = (request.form.get("user_mail").strip()).lower()
        try:
            mail_verify_db = db.session.execute(
                text("SELECT user_id, user_mail_verify FROM users WHERE user_mail = :user_mail"), {"user_mail" : user_mail}
                ).fetchall()[0]
            user_id = mail_verify_db[0]
            mail_verify = mail_verify_db[1]
        except:
            error_not = "This mail isn't used on the webapp!"
            return render_template("manual_mail_verification.html", error_not = error_not)

        if mail_verify == "verified":
            error = "This Mail is already used and verified"
            return render_template("login.html", error=error)
        else:
            session["user_id"] = user_id
            send_verification_mail_code(user_mail)
            return render_template("mail_verify.html", secret_key=secret_key)

@app.route("/forget_password",methods=["POST", "GET"])
def forget_password():
    if request.method == "GET":
        return render_template("forget_password.html")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return render_template("forget_password.html", error = error, secret_key=secret_key), 400

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
            return render_template("login.html", success=success, secret_key=secret_key)
        except:
            error = "This Email isn't saved"
            return render_template("forget_password.html", error = error, secret_key=secret_key)

@app.route("/logout", methods=["GET", "POST"])
def logout_route():
        logout()
        return redirect("/login_page")

@app.route("/home", methods=["GET"])
def home():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        user_id = session.get("user_id")
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        target_db = db.session.execute(
            text("SELECT * FROM target WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        if target_db:
            target_db = sorted(target_db, key=lambda x: (x[4], x[3]), reverse=True)
            target = target_db[0][2]
            mounth_db = int(target_db[0][3])
            year_db = int(target_db[0][4])
            now = datetime.datetime.now()
            mounth = now.month
            year = now.year

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
                return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path, score_txt=score_txt, score=score, target = target, secret_key=secret_key)
        else:
            return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path, secret_key=secret_key)

@app.route("/deposit", methods=["POST", "GET"])
def deposit():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        if request.method == "GET":
            return render_template("deposit.html", user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            trans_details = request.form.get("trans_details")

            if currency is None or amount is None :
                error = "You have to choose the currency!"
                return render_template("deposit.html", error = error,total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency,  user_photo_path=user_photo_path, secret_key=secret_key)

            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1
            except:
                trans_id = 1

            try:
                last_trans_key = db.session.execute(
                    text("SELECT MAX(trans_key) FROM trans")
                ).fetchone()[0]
                trans_key = last_trans_key + 1
            except:
                trans_key = 1

            last_networth_id = db.session.execute(
                    text("SELECT MAX(networth_id) FROM networth")
                ).fetchone()[0]
            if last_networth_id:
                networth_id = last_networth_id + 1
            else:
                networth_id = 1

            db.session.execute(
                text("INSERT INTO trans (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details) VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details)"),
                  {"date": date,"trans_key":trans_key, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "deposit", "trans_details": trans_details}
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

@app.route("/withdraw", methods=["POST", "GET"])
def withdraw():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        if request.method == "GET":
            user_id = session.get("user_id")
            currency_all = select_currencies(user_id)
            return render_template("withdraw.html", currency_all = currency_all, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                    error = "Cookies are blocked, please enable cookies from your browser settings"
                    return f'{error}', 400, logout()

            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            trans_details = request.form.get("trans_details")
            trans_details_link = request.form.get("trans_details_link")

            if currency == None or date == None or amount == None :
                error = "You have to choose the currency!"
                currency_all = select_currencies(user_id)
                return render_template("withdraw.html", currency_all = currency_all, error = error, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

            amount_of_currency = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id": user_id, "currency":currency}
            ).fetchone()[0]

            if amount > amount_of_currency:
                error = "This user doesn't have this amount of this currency"
                currency_all = select_currencies(user_id)
                return render_template("withdraw.html", currency_all = currency_all, error=error, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1
            except:
                trans_id = 1

            last_trans_key = db.session.execute(
                text("SELECT MAX(trans_key) FROM trans")
            ).fetchone()[0]
            if last_trans_key:
                trans_key = last_trans_key + 1
            else:
                trans_key = 1

            db.session.execute(
                text("INSERT INTO trans (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details, trans_details_link) VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details, :trans_details_link)"),
                  {"date": date,"trans_key":trans_key, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "withdraw", "trans_details": trans_details, "trans_details_link": trans_details_link}
            )
            db.session.commit()

            try:
                networth_db = db.session.execute(
                    text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                    {"user_id": user_id, "currency": currency}
                ).fetchone()
                networth_id = networth_db[0]
                total = int(networth_db[1])

                new_total = total - amount
                db.session.execute(
                    text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"),
                    {"total" :new_total, "networth_id": networth_id}
                )
                db.session.commit()

            except:
                error = "You don't have money from that currency!"
            return redirect("/home")

@app.route("/show_networth_details", methods=["GET"])
def show_networth_details():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        networth_details_db = db.session.execute(
            text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        networth_details = dict(networth_details_db)
        return render_template("networth_details.html", networth_details=networth_details, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/show_trans", methods=["GET"])
def show_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        from_date = request.args.get("from_date")
        to_date = request.args.get("to_date")

        now = datetime.datetime.now()

        first_day_current_month = now.replace(day=1)

        if now.month == 12:
            first_day_next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            first_day_next_month = now.replace(month=now.month + 1, day=1)

        if from_date is None:
            from_date = first_day_current_month.date()

        if to_date is None:
            to_date = first_day_next_month.date()

        trans_db = db.session.execute(
            text("SELECT * FROM trans WHERE user_id = :user_id AND date BETWEEN :from_date AND :to_date ORDER BY date"),
            {"user_id": user_id, "from_date" :from_date, "to_date" :to_date}
        ).fetchall()
        return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, to_date=to_date, from_date=from_date, secret_key=secret_key)

@app.route("/edit_trans", methods=["POST", "GET"])
def edit_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        user_id = session.get("user_id")
        if request.method == "GET":
            trans_key = request.args.get("trans_key")
            trans_db = db.session.execute(
                text("SELECT * FROM trans WHERE trans_key = :trans_key"),
                {"trans_key" :trans_key}
            ).fetchall()[0]
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("edit_trans.html", trans_db = trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            trans_key = request.form.get("trans_key")
            currency = request.form.get("currency")
            date = request.form.get("date")
            amount = request.form.get("amount")
            trans_details = request.form.get("trans_details")
            trans_details_link = request.form.get("trans_details_link")

            amount_currency_db = db.session.execute(
                text("SELECT amount, currency, trans_status FROM trans WHERE trans_key = :trans_key"),
                {"trans_key" :trans_key}
            ).fetchone()

            amount_db = int(amount_currency_db[0])
            status_db = amount_currency_db[2]

            total_db = db.session.execute(
                text("SELECT total from networth WHERE user_id = :user_id and currency = :currency"),
                {"user_id" :user_id, "currency" :currency}
            ).fetchone()[0]

            total_db = int(total_db)

            if status_db == "withdraw":
                total_db += amount_db
                total = total_db - int(amount)

            elif status_db == "deposit":
                total_db -= amount_db
                total = total_db + int(amount)

            if total < 0:
                error = "you don't have enough money from this currency!"
                trans_db = db.session.execute(
                    text("SELECT * FROM trans WHERE trans_key = :trans_key"),
                    {"trans_key" :trans_key}
                ).fetchall()[0]
                total_favorite_currency, favorite_currency = show_networth()
                total_favorite_currency = f"{total_favorite_currency:,.2f}"
                return render_template("edit_trans.html", trans_db = trans_db, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

            db.session.execute(
                text("UPDATE trans SET  date = :date, trans_details = :trans_details, trans_details_link = :trans_details_link, amount = :amount WHERE trans_key = :trans_key"),
                {"date" :date, "trans_details" :trans_details, "trans_details_link" :trans_details_link, "amount" :amount, "trans_key" :trans_key}
            )
            db.session.commit()

            db.session.execute(
                text("UPDATE networth SET total = :total WHERE user_id = :user_id and currency = :currency"),
                {"total" :total, "user_id" :user_id, "currency" :currency}
            )
            db.session.commit()

            trans_db = db.session.execute(
                text("SELECT * FROM trans WHERE user_id = :user_id"),
                {"user_id": user_id}
            ).fetchall()
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/delete_trans", methods=["POST"])
def delete_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        trans_key = request.form.get("trans_key")
        trans_db = db.session.execute(
            text("SELECT amount, currency, trans_status FROM trans WHERE trans_key = :trans_key"),
            {"trans_key" :trans_key}
        ).fetchone()

        amount_db = trans_db[0]
        currency_db = trans_db[1]
        trans_status_db = trans_db[2]

        total_db = db.session.execute(
            text("SELECT total FROM networth WHERE user_id = :user_id and currency = :currency"),
            {"user_id" :user_id, "currency" :currency_db}
        ).fetchone()[0]

        if trans_status_db == "deposit":
            total = total_db - int(amount_db)
            if total < 0:
                error = "You can't delete this transaction"
                trans_db = db.session.execute(
                    text("SELECT * FROM trans WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchall()
                return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

        elif trans_status_db == "withdraw":
            total = total_db + int(amount_db)

        trans_data_db = db.session.execute(
                text("SELECT currency, date, amount, trans_status, trans_details, trans_details_link FROM trans WHERE user_id = :user_id AND trans_key = :trans_key"),
                {"user_id": user_id, "trans_key" :trans_key}
            ).fetchone()

        currency = trans_data_db[0]
        date = trans_data_db[1]
        amount = trans_data_db[2]
        trans_status = trans_data_db[3]
        trans_details = trans_data_db[4]
        trans_details_link = trans_data_db[5]

        try:
            last_trans_trash_id = db.session.execute(
                    text("SELECT MAX(trans_trash_id) FROM trans_trash WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()[0]
            trans_trash_id = last_trans_trash_id + 1
        except:
            trans_trash_id = 1

        try:
            last_trans_trash_key = db.session.execute(
                text("SELECT MAX(trans_trash_key) FROM trans_trash")
            ).fetchone()[0]
            trans_trash_key = last_trans_trash_key + 1
        except:
            trans_trash_key = 1

        db.session.execute(
            text("INSERT INTO trans_trash (trans_trash_key, trans_trash_id, user_id, currency, date, amount, trans_status, trans_details, trans_details_link) VALUES(:trans_trash_key, :trans_trash_id, :user_id, :currency, :date, :amount, :trans_status, :trans_details, :trans_details_link)"),
            {"trans_trash_key" :trans_trash_key, "trans_trash_id": trans_trash_id, "user_id": user_id, "currency": currency, "date": date, "amount": amount, "trans_status": trans_status, "trans_details": trans_details, "trans_details_link": trans_details_link}
        )
        db.session.commit()

        db.session.execute(
            text("DELETE FROM trans WHERE trans_key = :trans_key"),
            {"trans_key" :trans_key}
        )
        db.session.commit()

        db.session.execute(
            text("UPDATE networth SET total = :total WHERE user_id = :user_id AND currency = :currency"),
            {"total" :total, "user_id" :user_id, "currency" :currency_db}
        )
        db.session.commit()

        db.session.execute(
            text("UPDATE wishlist SET status = :status WHERE trans_key = :trans_key"),
            {"status" :"pending", "trans_key" :trans_key}
        )
        db.session.commit()

        trans_db = db.session.execute(
            text("SELECT * FROM trans WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/settings/personal_info", methods=["GET", "POST"])
def personal_info():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        
        if request.method == "GET":
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            user_username = request.form.get("user_username")
            user_mail = request.form.get("user_mail")
            user_photo_path = request.form.get("user_photo_path")

            if "@" in user_username:
                error_existing = "username should not have @"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

            if "@" not in user_mail:
                error_existing = "mail should have @"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

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
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

                if existing_username:
                    error_existing = "Username is already in use. Please choose another one."
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

                send_verification_mail_code(user_mail)
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, secret_key=secret_key)

            if user_mail != user_mail_db:
                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()

                if existing_mail:
                    error_existing = "Mail is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

                send_verification_mail_code(user_mail)
                return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, user_username=user_username, user_mail_db=user_mail_db, secret_key=secret_key)

            if user_username != user_username_db:
                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_username:
                    error_existing = "Username is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

                db.session.execute(
                    text("UPDATE users SET user_username = :user_username WHERE user_id = :user_id"),
                    {"user_username" :user_username, "user_id":user_id}
                )
                db.session.commit()
                done = "User Name Changed Successfully!"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

        user_username, user_mail, user_photo_path = select_user_data(user_id)
        return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/settings/personal_info/mail_verification", methods=["POST"])
def mail_verification_change_mail():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
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

            msg = Message('Email Changed', sender='imhotepfinance@gmail.com', recipients=[user_mail_db])
            msg.body = f"Your E-mail has been changed now to {user_mail}"
            mail.send(msg)

            msg = Message('Welcome', sender='imhotepfinance@gmail.com', recipients=[user_mail])
            msg.body = f"Welcome {user_username} To Imhotep Finacial Manager"
            mail.send(msg)

            done = "User Mail Changed Successfully!"
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, done = done, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            error="Invalid verification code."
            return render_template("mail_verify_change_mail.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, error=error, secret_key=secret_key)

@app.route("/settings/personal_info/upload_user_photo", methods=["POST"])
def upload_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if "file" in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_extention = file_ext(filename)

                photo_name = f"{user_id}.{file_extention}"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER_PHOTO'], photo_name)

                delete_photo(user_id, photo_path)

                file.save(photo_path)

                db.session.execute(
                    text("UPDATE users SET user_photo_path = :user_photo_path WHERE user_id = :user_id"),
                    {"user_photo_path": photo_name, "user_id":user_id}
                )
                db.session.commit()
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
            else:
                error = "Invalid file format. Allowed formats are: png, jpg, jpeg"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            error = "file upload failed"
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/settings/personal_info/delete_user_photo", methods=["POST"])
def delete_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        photo_name = db.session.execute(
            text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchone()[0]

        if photo_name:
            photo_path = os.path.join(app.config['UPLOAD_FOLDER_PHOTO'], photo_name)

            delete_photo(user_id, photo_path)
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            error = "No image associated with this doctor to delete."
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/settings/favorite_currency", methods=["GET", "POST"])
def favorite_currency():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        user_id = session.get("user_id")
        if request.method == "GET":
            favorite_currency = select_favorite_currency(user_id)
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("favorite_currency.html", favorite_currency=favorite_currency, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, secret_key=secret_key)
        else:
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            favorite_currency = select_favorite_currency(user_id)
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            favorite_currency = request.form.get("favorite_currency")

            db.session.execute(
                text("UPDATE users SET favorite_currency = :favorite_currency WHERE user_id = :user_id"),
                {"favorite_currency" :favorite_currency, "user_id" :user_id}
            )
            db.session.commit()

            done = f"Your favorite currency is {favorite_currency} now"
            return render_template("favorite_currency.html", done=done, favorite_currency=favorite_currency, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, secret_key=secret_key)

@app.route("/settings/security_check", methods=["POST", "GET"])
def security_check_password():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        secret_key = session.get('secret_key')
        try:
            user_id = session.get("user_id")
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)   
             
        if request.method == "GET":
            return render_template("check_pass.html", secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            user_id = session.get("user_id")
            check_pass = request.form.get("check_pass")
            security = security_check(user_id, check_pass)

            if security:
                return render_template("change_pass.html", user_id = user_id, secret_key=secret_key)
            else:
                error = "This password is incorrect!"
                return render_template("check_pass.html", error = error, secret_key=secret_key)

@app.route("/settings/security", methods=["POST"])
def security():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()

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

        msg = Message('Password Change', sender='imhotepfinance@gmail.com', recipients=[user_mail])
        msg.body = f"Your password has been changed"
        mail.send(msg)

        logout()
        success = "You password has been changed successfully!"
        return render_template("login.html", success = success)

@app.route("/settings/set_target", methods=["GET","POST"])
def set_target():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            now = datetime.datetime.now()
            mounth = now.month
            year = now.year
            target_db = db.session.execute(
                text("SELECT * FROM target WHERE user_id = :user_id AND mounth = :mounth AND year = :year"),
                {"user_id" :user_id, "mounth" : mounth, "year":year}
            ).fetchall()
            if target_db:
                target_db = target_db[0]
                return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, target_db=target_db, secret_key=secret_key)
            else:
                return render_template("set_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency,user_photo_path=user_photo_path, secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            target = request.form.get("target")

            now = datetime.datetime.now()
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
            return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target=target, target_db=target_db, secret_key=secret_key)

@app.route("/settings/update_target", methods=["POST"])
def update_target():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        target = request.form.get("target")

        now = datetime.datetime.now()
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
        print(target_db)
        done = "Your Target have been updated"
        return render_template("update_target.html", total_favorite_currency=total_favorite_currency,favorite_currency=favorite_currency, done=done,user_photo_path=user_photo_path, target_db=target_db, secret_key=secret_key)

@app.route("/filter_year_wishlist", methods=["GET"])
def filter_year_wishlist():
        if not session.get("logged_in"):
            return redirect("/login_page")
        else:
            try:
                user_photo_path = select_user_photo()
            except OperationalError:
                error = "Welcome Back"
                return render_template('error.html', error=error)

            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            user_id = session.get("user_id")
            year = request.args.get("year")
            if year is None:
                today = date.today()
                year = today.year

            wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id and year = :year ORDER BY wish_id"),
                        {"user_id" :user_id, "year" :year}
                    ).fetchall()

            all_years = select_years_wishlist(user_id)

            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/add_wish", methods=["GET", "POST"])
def add_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            year = request.form.get("year")
            return render_template("add_wish.html", user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            user_id = session.get("user_id")
            price = request.form.get("price")
            currency = request.form.get("currency")
            wish_details = request.form.get("details")
            link = request.form.get("link")
            year = request.form.get("year")
            status = "pending"

            try:
                last_wish_id = db.session.execute(
                        text("SELECT MAX(wish_id) FROM wishlist WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                wish_id = last_wish_id + 1
            except:
                wish_id = 1

            try:
                last_wish_key = db.session.execute(
                    text("SELECT MAX(wish_key) FROM wishlist")
                ).fetchone()[0]
                wish_key = last_wish_key + 1
            except:
                wish_key = 1

            db.session.execute(
                text("INSERT INTO wishlist (wish_key, wish_id, user_id, price, currency, wish_details, link,year, status) VALUES (:wish_key, :wish_id, :user_id, :price, :currency, :wish_details, :link,:year, :status)"),
                {"wish_key" :wish_key, "wish_id" :wish_id, "user_id" :user_id, "price" :price, "currency" :currency, "wish_details" :wish_details, "link" :link, "year" :year, "status" :status}
            )
            db.session.commit()
            done = "wish added successfully!"

            wishlist_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                {"user_id" :user_id , "year" :year}
            ).fetchall()

            all_years = select_years_wishlist(user_id)
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, done = done, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/check_wish", methods=["POST"])
def check_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        user_id = session.get("user_id")
        wish_key = request.form.get("wish_key")

        wishlist_data_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE wish_key = :wish_key"),
                {"wish_key" :wish_key}
            ).fetchone()

        currency = wishlist_data_db[3]
        amount = wishlist_data_db[4]
        status = wishlist_data_db[5]
        link = wishlist_data_db[6]
        wish_details = wishlist_data_db[7]
        year = wishlist_data_db[8]
        current_date = date.today()

        if currency in select_currencies(user_id):

            total_db = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id" :user_id, "currency" :currency}
            ).fetchone()[0]

            if int(total_db) < int(amount) and status == "pending":
                error = "You don't have on your balance this currency!"
                year, wishlist_db = wishlist_page(user_id)
                all_years = select_years_wishlist(user_id)
                total_favorite_currency, favorite_currency = show_networth()
                total_favorite_currency = f"{total_favorite_currency:,.2f}"
                return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
            else:
                try:
                    last_trans_key = db.session.execute(
                        text("SELECT MAX(trans_key) FROM trans")
                    ).fetchone()[0]
                    trans_key = last_trans_key + 1
                except:
                    trans_key = 1

                if status == "pending":
                    new_total = int(total_db) - int(amount)
                    new_status = "done"

                    try:
                        last_trans_id = db.session.execute(
                                text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                                {"user_id": user_id}
                            ).fetchone()[0]
                        trans_id = last_trans_id + 1
                    except:
                        trans_id = 1

                    db.session.execute(
                        text("INSERT INTO trans (currency, amount, trans_details, trans_details_link, user_id, trans_id, trans_key, trans_status, date) VALUES(:currency, :amount, :trans_details, :trans_details_link, :user_id, :trans_id, :trans_key, :trans_status, :date)"),
                        {"currency" :currency, "amount" :amount, "trans_details" :wish_details, "trans_details_link" :link, "user_id" :user_id, "trans_id" :trans_id, "trans_key" :trans_key, "trans_status" :"withdraw", "date" :current_date}
                    )
                    db.session.commit()

                    db.session.execute(
                        text("UPDATE networth SET total = :total WHERE currency = :currency AND user_id = :user_id"),
                        {"total" :new_total,"currency" :currency, "user_id" :user_id}
                    )
                    db.session.commit()

                    db.session.execute(
                        text("UPDATE wishlist SET trans_key = :trans_key, status = :status WHERE wish_key = :wish_key"),
                        {"trans_key" :trans_key,"status" :new_status, "wish_key" :wish_key}
                    )
                    db.session.commit()

                    wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                        {"user_id" :user_id , "year" :year}
                    ).fetchall()

                    all_years = select_years_wishlist(user_id)
                    total_favorite_currency, favorite_currency = show_networth()
                    total_favorite_currency = f"{total_favorite_currency:,.2f}"
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

                elif status == "done":
                    new_status = "pending"
                    new_total = int(total_db) + int(amount)

                    trans_key = db.session.execute(
                        text("SELECT trans_key FROM wishlist WHERE wish_key = :wish_key"),
                        {"wish_key" :wish_key}
                    ).fetchone()[0]

                    db.session.execute(
                        text("DELETE FROM trans WHERE trans_key = :trans_key"),
                        {"trans_key" :trans_key}
                    )
                    db.session.commit()

                    db.session.execute(
                        text("UPDATE networth SET total = :total WHERE currency = :currency AND user_id = :user_id"),
                        {"total" :new_total,"currency" :currency, "user_id" :user_id}
                    )
                    db.session.commit()

                    db.session.execute(
                        text("UPDATE wishlist SET trans_key = :trans_key, status = :status WHERE wish_key = :wish_key"),
                        {"trans_key" :None, "status" :new_status, "wish_key" :wish_key}
                    )
                    db.session.commit()

                    wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                        {"user_id" :user_id , "year" :year}
                    ).fetchall()
                    all_years = select_years_wishlist(user_id)
                    total_favorite_currency, favorite_currency = show_networth()
                    total_favorite_currency = f"{total_favorite_currency:,.2f}"
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

        else:
            error = "You don't have on your balance enough of this currency!"
            year, wishlist_db = wishlist_page(user_id)
            all_years = select_years_wishlist(user_id)
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)


@app.route("/edit_wish", methods=["GET", "POST"])
def edit_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            wish_key = request.args.get("wish_key")
            wish_db = db.session.execute(
                text("SELECT year, price, currency, wish_details, link, wish_key FROM wishlist WHERE wish_key = :wish_key"),
                {"wish_key" :wish_key}
            ).fetchone()
            return render_template("edit_wish.html", wish_db=wish_db,user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)
        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            wish_key = request.form.get("wish_key")
            year = request.form.get("year")
            price = request.form.get("price")
            currency = request.form.get("currency")
            details = request.form.get("details")
            link = request.form.get("link")

            db.session.execute(
                text("UPDATE wishlist SET year = :year, price = :price, currency= :currency, wish_details = :wish_details, link = :link WHERE wish_key = :wish_key"),
                {"year" :year, "price" :price, "currency" :currency, "wish_details" :details, "link" :link, "wish_key" :wish_key}
            )
            db.session.commit()

            wishlist_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                {"user_id" :user_id , "year" :year}
            ).fetchall()

            all_years = select_years_wishlist(user_id)
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/delete_wish", methods=["POST"])
def delete_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        wish_key = request.form.get("wish_key")

        wish_data_db = db.session.execute(
                        text("SELECT currency, price, link, wish_details, year FROM wishlist WHERE user_id = :user_id AND wish_key = :wish_key"),
                        {"user_id": user_id, "wish_key" :wish_key}
                    ).fetchone()

        currency = wish_data_db[0]
        price = wish_data_db[1]
        link = wish_data_db[2]
        wish_details = wish_data_db[3]
        year_db = wish_data_db[4]

        try:
            last_wish_trash_id = db.session.execute(
                    text("SELECT MAX(wish_trash_id) FROM wishlist_trash WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()[0]
            wish_trash_id = last_wish_trash_id + 1
        except:
            wish_trash_id = 1

        try:
            last_wish_trash_key = db.session.execute(
                text("SELECT MAX(wish_trash_key) FROM wishlist_trash")
            ).fetchone()[0]
            wish_trash_key = last_wish_trash_key + 1
        except:
            wish_trash_key = 1

        db.session.execute(
            text("INSERT INTO wishlist_trash (wish_trash_key, wish_trash_id, user_id, currency, price, link, wish_details, year) VALUES(:wish_trash_key, :wish_trash_id, :user_id, :currency, :price, :link, :wish_details, :year_db)"),
            {"wish_trash_key" :wish_trash_key, "wish_trash_id": wish_trash_id, "user_id": user_id, "currency": currency, "price": price, "link": link, "wish_details": wish_details, "year_db": year_db}
        )
        db.session.commit()

        db.session.execute(
            text("DELETE FROM wishlist WHERE wish_key = :wish_key"),
            {"wish_key" :wish_key}
        )
        db.session.commit()

        year, wishlist_db = wishlist_page(user_id)
        all_years = select_years_wishlist(user_id)
        return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key)

@app.route("/delete_user", methods=["POST", "GET"])
def delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        return render_template("check_pass_delete_user.html", total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, secret_key=secret_key)

@app.route("/delete_user/check_pass", methods=["POST"])
def check_pass_delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
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
            msg = Message('Delete Verification', sender='imhotepfinance@gmail.com', recipients=[user_mail])
            msg.body = f"Your verification code is: {verification_code}"
            mail.send(msg)

            session["verification_code"] = verification_code

            return render_template("mail_verify_delete_user.html", user_id = user_id, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, user_mail=user_mail, secret_key=secret_key)
        else:
            error = "This password is incorrect!"
            return render_template("check_pass_delete_user.html", error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, user_photo_path=user_photo_path, secret_key=secret_key)

@app.route("/delete_user/verify_delete_user", methods=["POST"])
def verify_delete_user():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()

        verification_code = request.form.get("verification_code").strip()
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
            msg = Message('Accout Deleted', sender='imhotepfinance@gmail.com', recipients=[user_mail])
            msg.body = "Account Deleted"
            mail.send(msg)

            db.session.execute(
                text("DELETE FROM users WHERE user_id = :user_id"),
                {"user_id": user_id}
                )
            db.session.commit()
            logout()

            success="Account Deleted"
            return render_template("login.html", success=success, secret_key=secret_key)

        else:
            error="Invalid verification code."
            return render_template("mail_verify_delete_user.html", error=error, secret_key=secret_key)

@app.route("/trash_wishlist", methods=["GET", "POST"])
def trash_wishlist():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_wishlist_data=trash_wishlist_data)

        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            wish_trash_key = request.form.get("wish_trash_key")
            trash_wishlist_data = db.session.execute(
                text("SELECT currency, price, link, wish_details, year FROM wishlist_trash WHERE user_id = :user_id AND wish_trash_key = :wish_trash_key"),
                {"user_id" :user_id, "wish_trash_key" :wish_trash_key}
            ).fetchone()
            try:
                last_wish_id = db.session.execute(
                        text("SELECT MAX(wish_id) FROM wishlist WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                wish_id = last_wish_id + 1
            except:
                wish_id = 1

            try:
                last_wish_key = db.session.execute(
                    text("SELECT MAX(wish_key) FROM wishlist")
                ).fetchone()[0]
                wish_key = last_wish_key + 1
            except:
                wish_key = 1

            currency = trash_wishlist_data[0]
            price = trash_wishlist_data[1]
            link = trash_wishlist_data[2]
            wish_details = trash_wishlist_data[3]
            year = trash_wishlist_data[4]

            db.session.execute(
                text("INSERT INTO wishlist (wish_key, wish_id, user_id, currency, price, link, wish_details, year, status) VALUES (:wish_key, :wish_id, :user_id, :currency, :price, :link, :wish_details, :year, :status)"),
                {"wish_key": wish_key, "wish_id": wish_id, "user_id" :user_id, "currency" :currency, "price" :price, "link" :link, "wish_details" :wish_details, "year" :year, "status" :"pending"}
            )
            db.session.commit()

            db.session.execute(
                text("DELETE FROM wishlist_trash WHERE wish_trash_key = :wish_trash_key"),
                {"wish_trash_key" :wish_trash_key}
            )
            db.session.commit()

            trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_wishlist_data=trash_wishlist_data)

@app.route("/delete_trash_wishlist", methods=["POST"])
def delete_trash_wishlist():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        wish_trash_key = request.form.get("wish_trash_key")
        db.session.execute(
            text("DELETE FROM wishlist_trash WHERE wish_trash_key = :wish_trash_key"),
            {"wish_trash_key" :wish_trash_key}
        )
        db.session.commit()

        trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
        ).fetchall()

        return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_wishlist_data=trash_wishlist_data)

@app.route("/trash_trans", methods=["GET", "POST"])
def trash_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":

            trash_trans_data = db.session.execute(
                text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_trans_data=trash_trans_data)

        else:
            if request.form.get("secret_key") != session.get('secret_key'):
                error = "Cookies are blocked, please enable cookies from your browser settings"
                return f'{error}', 400, logout()

            trans_trash_key = request.form.get("trans_trash_key")
            trash_trans_data = db.session.execute(
                text("SELECT currency, date, amount, trans_status, trans_details, trans_details_link FROM trans_trash WHERE user_id = :user_id AND trans_trash_key = :trans_trash_key"),
                {"user_id" :user_id, "trans_trash_key" :trans_trash_key}
            ).fetchone()

            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1
            except:
                trans_id = 1

            try:
                last_trans_key = db.session.execute(
                    text("SELECT MAX(trans_key) FROM trans")
                ).fetchone()[0]
                trans_key = last_trans_key + 1
            except:
                trans_key = 1

            currency = trash_trans_data[0]
            date = trash_trans_data[1]
            amount = trash_trans_data[2]
            trans_status = trash_trans_data[3]
            trans_details = trash_trans_data[4]
            trans_details_link = trash_trans_data[5]

            db.session.execute(
                text("INSERT INTO trans (trans_key, trans_id, user_id, currency, date, amount, trans_status, trans_details, trans_details_link) VALUES (:trans_key, :trans_id, :user_id, :currency, :date, :amount, :trans_status, :trans_details, :trans_details_link)"),
                {"trans_key": trans_key, "trans_id": trans_id, "user_id" :user_id, "currency" :currency, "date" :date, "amount" :amount, "trans_status" :trans_status, "trans_details" :trans_details, "trans_details_link" :trans_details_link}
            )
            db.session.commit()

            total_db = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id and currency = :currency"),
                {"user_id" :user_id, "currency" :currency}
            ).fetchone()[0]

            if trans_status == "deposit":
                total = total_db + int(amount)
            elif trans_status == "withdraw":
                total = total_db - int(amount)

            db.session.execute(
                text("UPDATE networth SET total = :total WHERE user_id = :user_id AND currency = :currency"),
                {"total" :total, "user_id" :user_id, "currency" :currency}
            )
            db.session.commit()

            db.session.execute(
                text("DELETE FROM trans_trash WHERE trans_trash_key = :trans_trash_key"),
                {"trans_trash_key" :trans_trash_key}
            )
            db.session.commit()

            trash_trans_data = db.session.execute(
                text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_trans_data=trash_trans_data)

@app.route("/delete_trash_trans", methods=["POST"])
def delete_trash_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.form.get("secret_key") != session.get('secret_key'):
            error = "Cookies are blocked, please enable cookies from your browser settings"
            return f'{error}', 400, logout()
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error)
        
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")

        trans_trash_key = request.form.get("trans_trash_key")

        db.session.execute(
            text("DELETE FROM trans_trash WHERE trans_trash_key = :trans_trash_key"),
            {"trans_trash_key" :trans_trash_key}
        )
        db.session.commit()

        trash_trans_data = db.session.execute(
            text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchall()

        return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, secret_key=secret_key, trash_trans_data=trash_trans_data)

@app.route("/version")
def version():
    return render_template("version.html", secret_key=secret_key)

@app.route("/download")
def download():
    return render_template("download.html", secret_key=secret_key)

@app.after_request
def add_header(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response

@app.after_request
def remove_csp_header(response):
    if 'Content-Security-Policy' in response.headers:
        del response.headers['Content-Security-Policy']
    return response

@app.after_request
def set_content_type_options(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

@app.route('/sitemap.xml')
def sitemap():
    pages = []

    ten_days_ago = (datetime.datetime.now() - datetime.timedelta(days=10)).date().isoformat()
    for rule in app.url_map.iter_rules():
        if "GET" in rule.methods and len(rule.arguments) == 0:
            pages.append(
                ["https://imhotepf.pythonanywhere.com" + str(rule.rule), ten_days_ago]
            )

    sitemap_xml = render_template('sitemap.xml', pages=pages)
    response = make_response(sitemap_xml)
    response.headers["Content-Type"] = "application/xml"

    return response
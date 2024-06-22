from flask import render_template, redirect, Flask, session, request
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from sqlalchemy import text
import requests
from werkzeug.utils import secure_filename
import os

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


app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024
app.config["UPLOAD_FOLDER_PHOTO"] = os.path.join(os.getcwd(), "static", "user_photo")
ALLOWED_EXTENSIONS = ("png", "jpg", "jpeg")

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
    favorite_currency = select_favorite_currency(user_id)

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
        user_photo_path = select_user_photo()
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        return render_template("home.html", total_favorite_currency = total_favorite_currency, favorite_currency=favorite_currency , user_photo_path=user_photo_path)

@app.route("/deposit", methods=["POST", "GET"])
def deposit():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        if request.method == "GET":
            user_photo_path = select_user_photo()
            return render_template("deposit.html", user_photo_path=user_photo_path)
        else:
            user_photo_path = select_user_photo()
            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            trans_details = request.form.get("trans_details")

            if currency == None or date == None or amount == None :
                error = "You have to choose the currency!"
                return render_template("deposit.html", error = error)
            
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
        if request.method == "GET":
            user_photo_path = select_user_photo()
            user_id = session.get("user_id")
            currency_all = select_currencies(user_id)
            return render_template("withdraw.html", currency_all = currency_all, user_photo_path=user_photo_path)
        
        else:
            user_photo_path = select_user_photo()
            date = request.form.get("date")
            amount = int(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            trans_details = request.form.get("trans_details")
            trans_details_link = request.form.get("trans_details_link")

            if currency == None or date == None or amount == None :
                error = "You have to choose the currency!"
                currency_all = select_currencies(user_id)
                user_photo_path = select_user_photo()
                return render_template("withdraw.html", currency_all = currency_all, error = error, user_photo_path=user_photo_path)
            
            amount_of_currency = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id": user_id, "currency":currency}
            ).fetchone()[0]

            if amount > amount_of_currency:
                error = "This user doesn't have this amount of this currency"
                currency_all = select_currencies(user_id)
                user_photo_path = select_user_photo()
                return render_template("withdraw.html", currency_all = currency_all, error=error, user_photo_path=user_photo_path)

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
        user_photo_path = select_user_photo()
        user_id = session.get("user_id")
        networth_details_db = db.session.execute(
            text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        networth_details = dict(networth_details_db)
        return render_template("networth_details.html", networth_details=networth_details, user_photo_path=user_photo_path)

@app.route("/show_trans", methods=["GET"])
def show_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_photo_path = select_user_photo()
        user_id = session.get("user_id")
        trans_db = db.session.execute(
            text("SELECT * FROM trans WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()

        return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path)
    
@app.route("/settings/personal_info", methods=["GET", "POST"])
def personal_info():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id") 
        if request.method == "GET":
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path)
        else:
            user_username = request.form.get("user_username")
            user_mail = request.form.get("user_mail")
            user_photo_path = request.form.get("user_photo_path")
            
            user_username_mail_db = db.session.execute(
                text("SELECT user_mail, user_username FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()

            user_mail_db = user_username_mail_db[0]
            user_username_db = user_username_mail_db[1]

            if user_mail != user_mail_db:
                existing_mail = db.session.execute(
                text("SELECT user_mail FROM users WHERE LOWER(user_mail) = :user_mail"),
                {"user_mail": user_mail}
                ).fetchall()
                if existing_mail:
                    error_existing = "Mail is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing)
                
                db.session.execute(
                    text("UPDATE users SET user_mail_verify = :user_mail_verify, user_mail = :user_mail WHERE user_id = :user_id"),
                    {"user_mail_verify" :"not_verified", "user_mail" :user_mail, "user_id":user_id}
                )
                db.session.commit()

                send_verification_mail_code(user_mail)

                return render_template("mail_verify.html")
            
            if user_username != user_username_db:
                existing_username = db.session.execute(
                    text("SELECT user_username FROM users WHERE LOWER(user_username) = :user_username"),
                    {"user_username": user_username}
                ).fetchall()

                if existing_username:
                    error_existing = "Username is already in use. Please choose another one. or "
                    user_username, user_mail, user_photo_path = select_user_data(user_id)
                    return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error_existing)

            db.session.execute(
                text("UPDATE users SET user_username = :user_username WHERE user_id = :user_id"),
                {"user_username" :user_username, "user_id":user_id}
            )
            db.session.commit()

            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path)
        
@app.route("/settings/personal_info/upload_user_photo", methods=["POST"])
def upload_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
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
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path)
            else:
                error = "Invalid file format. Allowed formats are: png, jpg, jpeg"
                user_username, user_mail, user_photo_path = select_user_data(user_id)
                return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error)
        else:
            error = "file upload failed"
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error)
    
@app.route("/settings/personal_info/delete_user_photo", methods=["POST"])
def delete_user_photo():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        photo_name = db.session.execute(
            text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchone()[0]

        if photo_name:
            photo_path = os.path.join(app.config['UPLOAD_FOLDER_PHOTO'], photo_name)

            delete_photo(user_id, photo_path)
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path)
        else:
            error = "No image associated with this doctor to delete." #if this docotr don't have an image
            user_username, user_mail, user_photo_path = select_user_data(user_id)
            return render_template("personal_info.html", user_username=user_username, user_mail=user_mail, user_photo_path=user_photo_path, error=error)

@app.route("/settings/favorite_currency", methods=["GET", "POST"])
def favorite_currency():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        if request.method == "GET":
            favorite_currency = select_favorite_currency(user_id)
            return render_template("favorite_currency.html", favorite_currency=favorite_currency)
        else:
            favorite_currency = request.form.get("favorite_currency")
            db.session.execute(
                text("UPDATE users SET favorite_currency = :favorite_currency WHERE user_id = :user_id"), 
                {"favorite_currency" :favorite_currency, "user_id" :user_id}
            )
            db.session.commit()

            done = f"Your favorite currency is {favorite_currency} now"
            favorite_currency = select_favorite_currency(user_id)
            return render_template("favorite_currency.html", done=done, favorite_currency=favorite_currency)
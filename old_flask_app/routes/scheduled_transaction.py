from flask import render_template, redirect, session, request, Blueprint
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from extensions import db
from config import CSRFForm, Config
from utils.user_info import select_user_photo, trans, get_app_currencies, get_user_categories, select_scheduled_trans, delete_scheduled_trans
from utils.currencies import show_networth
from datetime import datetime

scheduled_transactions_bp = Blueprint('scheduled_transactions', __name__)

@scheduled_transactions_bp.route("/add_scheduled_transaction", methods=["POST", "GET"])
def add_scheduled_transaction():
    """Add a scheduled transaction for the logged-in user."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())
        
        user_id = session.get("user_id") #get user id from session
        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas

        user_categories = get_user_categories("ANY", user_id) #get user categories

        if request.method == "GET": #handle get request
            return render_template("add_scheduled_transaction.html",
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    available_currencies=get_app_currencies(),
                                    user_categories=user_categories) #render add scheduled transaction page
        else: #handle post request

            day_of_month = request.form.get("day_of_month") #get day of month from form
            amount = float(request.form.get("amount")) #get amount from form and convert to float
            currency = request.form.get("currency") #get currency from form
            user_id = session.get("user_id") #get user id from session
            scheduled_trans_details = request.form.get("scheduled_trans_details") #get transaction details from form
            category = request.form.get("category") #get category from form
            scheduled_trans_status = request.form.get("scheduled_trans_status") #get transaction status from form

            if currency is None or amount is None : #validate required fields
                error = "You have to choose the currency!" #validation error message
                return render_template("deposit.html", error = error,total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency,  user_photo_path=user_photo_path, form=CSRFForm())

            #get the last scheduled transaction id for the user
            try:
                last_scheduled_trans_id = db.session.execute(
                        text("SELECT MAX(scheduled_trans_id) FROM scheduled_trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                scheduled_trans_id = last_scheduled_trans_id + 1 #increment for new transaction
            except:
                scheduled_trans_id = 1 #first scheduled transaction for user

            #get the last scheduled transaction key in the database
            try:
                last_scheduled_trans_key = db.session.execute(
                    text("SELECT MAX(scheduled_trans_key) FROM scheduled_trans")
                ).fetchone()[0]
                scheduled_trans_key = last_scheduled_trans_key + 1 #increment for new transaction
            except:
                scheduled_trans_key = 1 #first scheduled transaction in database

            #insert new scheduled transaction into database
            db.session.execute(
                text('''
                    INSERT INTO scheduled_trans
                    (date, scheduled_trans_key, amount, currency, user_id, scheduled_trans_id, scheduled_trans_status, scheduled_trans_details, category, last_time_added, status)
                    VALUES (:date, :scheduled_trans_key, :amount, :currency, :user_id, :scheduled_trans_id, :scheduled_trans_status, :scheduled_trans_details, :category, :last_time_added, :status)
                    '''),
                    {"date": day_of_month,
                    "scheduled_trans_key":scheduled_trans_key,
                    "amount": amount,
                    "currency": currency,
                    "user_id": user_id,
                    "scheduled_trans_id": scheduled_trans_id,
                    "scheduled_trans_status": scheduled_trans_status,
                    "scheduled_trans_details": scheduled_trans_details,
                    "category":category,
                    "last_time_added": None,
                    "status": True}
            )
            db.session.commit() #commit changes to database

            return redirect("/home") #redirect to home page

@scheduled_transactions_bp.route("/edit_scheduled_trans", methods=["POST", "GET"])
def edit_scheduled_trans():
    """Edit an existing scheduled transaction."""
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
            scheduled_trans_key = request.args.get("scheduled_trans_key") #get transaction key from url parameters
            #get scheduled transaction data from database
            scheduled_trans_db = db.session.execute(
                text("SELECT * FROM scheduled_trans WHERE scheduled_trans_key = :scheduled_trans_key"),
                {"scheduled_trans_key" :scheduled_trans_key}
            ).fetchall()[0]
            total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
            total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas

            return render_template("edit_scheduled_trans.html",
                                    scheduled_trans_db = scheduled_trans_db,
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    currency = scheduled_trans_db[3],
                                    available_currencies=get_app_currencies()) #render edit scheduled transaction page

        else: #handle post request

            scheduled_trans_key = request.form.get("scheduled_trans_key") #get transaction key from form
            currency = request.form.get("currency") #get currency from form
            print(currency) #debug print for currency value
            date = request.form.get("date") #get date from form
            amount = request.form.get("amount") #get amount from form
            scheduled_trans_details = request.form.get("scheduled_trans_details") #get transaction details from form
            scheduled_trans_link = request.form.get("scheduled_trans_link") #get transaction link from form
            category = request.form.get("category") #get category from form

            #get current amount, currency and status from database
            amount_currency_db = db.session.execute(
                text("SELECT amount, currency, scheduled_trans_status FROM scheduled_trans WHERE scheduled_trans_key = :scheduled_trans_key"),
                {"scheduled_trans_key" :scheduled_trans_key}
            ).fetchone()

            #update scheduled transaction in database
            db.session.execute(
                text('''
                     UPDATE scheduled_trans
                      SET  date = :date,
                      scheduled_trans_details = :scheduled_trans_details,
                      scheduled_trans_link = :scheduled_trans_link,
                      amount = :amount,
                      category = :category,
                     currency = :currency
                      WHERE scheduled_trans_key = :scheduled_trans_key'''
                     ),
                {"date" :date,
                  "scheduled_trans_details" :scheduled_trans_details,
                    "scheduled_trans_link" :scheduled_trans_link,
                      "amount" :amount,
                        "scheduled_trans_key" :scheduled_trans_key,
                          "category":category,
                          "currency":currency}

            )
            db.session.commit() #commit changes to database

            return redirect("/show_scheduled_trans") #redirect to show scheduled transactions page

@scheduled_transactions_bp.route("/show_scheduled_trans", methods=["GET"])
def show_scheduled_trans():
    """Show all scheduled transactions for the logged-in user."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        user_id = session.get("user_id") #get user id from session
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
        total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas

        page = int(request.args.get("page", 1)) #get page number from url parameters with default 1
        scheduled_trans, total_pages, page = select_scheduled_trans(user_id, page) #get scheduled transactions with pagination

        return render_template("show_scheduled_trans.html", scheduled_trans=scheduled_trans, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, total_pages=total_pages,page=page, form=CSRFForm()) #render show scheduled transactions page

@scheduled_transactions_bp.route("/delete_scheduled_trans", methods=["POST"])
def delete_scheduled_trans_route():
    """Delete a scheduled transaction."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    
    # Validate CSRF token
    form = CSRFForm()
    if not form.validate_on_submit():
        return redirect("/show_scheduled_trans?error=invalid_request") #redirect with error message
    
    user_id = session.get("user_id") #get user id from session
    scheduled_trans_key = request.form.get("scheduled_trans_key") #get transaction key from form
    confirm_delete = request.form.get("confirm_delete") #get confirmation from form
    
    if confirm_delete == "yes" and scheduled_trans_key:
        success = delete_scheduled_trans(user_id, scheduled_trans_key) #delete the transaction
        if success:
            return redirect("/show_scheduled_trans?deleted=true") #redirect with success message
        else:
            return redirect("/show_scheduled_trans?error=delete_failed") #redirect with error message
    else:
        return redirect("/show_scheduled_trans") #redirect if not confirmed

@scheduled_transactions_bp.route("/change_status_of_scheduled_trans", methods=["GET"])
def change_status_of_scheduled_trans():
    """Change the status of a scheduled transaction (active/inactive)."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        user_id = session.get("user_id") #get user id from session
        scheduled_trans_key = request.args.get("scheduled_trans_key") #get transaction key from url parameters
        
        # Verify the transaction belongs to the user before updating
        trans_exists = db.session.execute(
            text("SELECT COUNT(*) FROM scheduled_trans WHERE user_id = :user_id AND scheduled_trans_key = :scheduled_trans_key"),
            {"user_id": user_id, "scheduled_trans_key": scheduled_trans_key}
        ).scalar()
        
        if trans_exists > 0:
            #toggle the status of the scheduled transaction
            db.session.execute(
                text('''
                    UPDATE scheduled_trans SET status = NOT(status) WHERE scheduled_trans_key = :scheduled_trans_key AND user_id = :user_id
                '''),
                {"scheduled_trans_key": scheduled_trans_key, "user_id": user_id}
            )
            db.session.commit() #commit changes to database

        return redirect("/show_scheduled_trans") #redirect to show scheduled transactions page
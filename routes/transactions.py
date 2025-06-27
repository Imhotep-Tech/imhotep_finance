from flask import render_template, redirect, session, request, Blueprint, flash, flash, url_for, Response
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from extensions import db
from config import CSRFForm, Config
from utils.user_info import select_user_photo, trans, get_app_currencies, get_user_categories
from utils.currencies import show_networth, select_currencies
from datetime import datetime
from openpyxl import Workbook
import io
import csv
from utils.recalculate_networth import recalculate_networth

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route("/deposit", methods=["POST", "GET"])
def deposit():
    """Handle deposit transactions for the logged-in user."""
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

        # Get user's most frequent income categories
        user_categories = get_user_categories("deposit", user_id) #get user's deposit categories

        if request.method == "GET": #handle get request
            return render_template("deposit.html",
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    available_currencies=get_app_currencies(),
                                    user_categories=user_categories) #render deposit page
        else: #handle post request

            date = request.form.get("date") #get date from form
            amount = float(request.form.get("amount")) #get amount from form and convert to float
            currency = request.form.get("currency") #get currency from form
            user_id = session.get("user_id") #get user id from session
            trans_details = request.form.get("trans_details") #get transaction details from form
            category = request.form.get("category") #get category from form

            if currency is None or amount is None : #validate required fields
                error = "You have to choose the currency!" #validation error message
                return render_template("deposit.html", error = error,total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency,  user_photo_path=user_photo_path, form=CSRFForm())

            #get the last transaction id for the user
            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1 #increment for new transaction
            except:
                trans_id = 1 #first transaction for user

            #get the last transaction key in the database
            try:
                last_trans_key = db.session.execute(
                    text("SELECT MAX(trans_key) FROM trans")
                ).fetchone()[0]
                trans_key = last_trans_key + 1 #increment for new transaction
            except:
                trans_key = 1 #first transaction in database

            #insert new deposit transaction into database
            db.session.execute(
                text("INSERT INTO trans (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details, category) VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details, :category)"),
                  {"date": date,"trans_key":trans_key, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "deposit", "trans_details": trans_details, "category":category}
            )
            db.session.commit() #commit transaction to database

            #get existing networth for user and currency
            networth_db = db.session.execute(
                text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id": user_id, "currency": currency}
            ).fetchone()

            if networth_db: #check if networth record exists
                networth_id = networth_db[0] #get networth id
                total = float(networth_db[1]) #get current total

                new_total_calc = total + amount #add deposit amount to total

                #to make sure that the networth is calculated correctly and there is no unexpected error happened
                new_total = recalculate_networth(user_id, new_total_calc, currency) #recalculate networth

                #update networth in database
                db.session.execute(
                    text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"),
                    {"total" :new_total, "networth_id": networth_id}
                )
                db.session.commit() #commit networth update

            else: #create new networth record
                #get next networth id
                networth_id = db.session.execute(
                    text("SELECT COALESCE(MAX(networth_id), 0) + 1 FROM networth")
                ).fetchone()[0]
                
                #insert new networth record
                db.session.execute(
                    text("INSERT INTO networth (networth_id,  user_id , currency, total) VALUES (:networth_id,  :user_id , :currency, :total)"),
                    {"networth_id": networth_id, "user_id": user_id, "currency": currency, "total": amount}
                )
                db.session.commit() #commit networth creation

            return redirect("/home") #redirect to home page

@transactions_bp.route("/withdraw", methods=["POST", "GET"])
def withdraw():
    """Handle withdrawal transactions for the logged-in user."""
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
        user_categories = get_user_categories("withdraw", user_id) #get user's withdrawal categories
        
        if request.method == "GET": #handle get request
            currency_all = select_currencies(user_id) #get user's available currencies
            return render_template("withdraw.html", 
                                 currency_all=currency_all, 
                                 user_photo_path=user_photo_path, 
                                 total_favorite_currency=total_favorite_currency, 
                                 favorite_currency=favorite_currency, 
                                 form=CSRFForm(),
                                 user_categories=user_categories) #render withdraw page

        else: #handle post request
            date = request.form.get("date") #get date from form
            amount = float(request.form.get("amount")) #get amount from form and convert to float
            currency = request.form.get("currency") #get currency from form
            trans_details = request.form.get("trans_details") #get transaction details from form
            trans_details_link = request.form.get("trans_details_link") #get transaction link from form
            category = request.form.get("category") #get category from form

            if currency == None or date == None or amount == None : #validate required fields
                error = "You have to choose the currency!" #validation error message
                currency_all = select_currencies(user_id)
                return render_template("withdraw.html", 
                                     currency_all=currency_all, 
                                     error=error, 
                                     user_photo_path=user_photo_path, 
                                     total_favorite_currency=total_favorite_currency, 
                                     favorite_currency=favorite_currency, 
                                     form=CSRFForm(),
                                     user_categories=user_categories)
            
            #get user's current balance for this currency
            amount_of_currency = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id": user_id, "currency":currency}
            ).fetchone()[0]

            if amount > amount_of_currency: #check if sufficient balance
                error = "This user doesn't have this amount of this currency" #insufficient balance error
                currency_all = select_currencies(user_id)
                return render_template("withdraw.html", 
                                     currency_all=currency_all, 
                                     error=error, 
                                     user_photo_path=user_photo_path, 
                                     total_favorite_currency=total_favorite_currency, 
                                     favorite_currency=favorite_currency, 
                                     form=CSRFForm(),
                                     user_categories=user_categories)
            
            #get the last transaction id for the user
            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1 #increment for new transaction
            except:
                trans_id = 1 #first transaction for user

            #get the last transaction key in the database
            last_trans_key = db.session.execute(
                text("SELECT MAX(trans_key) FROM trans")
            ).fetchone()[0]
            if last_trans_key:
                trans_key = last_trans_key + 1 #increment for new transaction
            else:
                trans_key = 1 #first transaction in database

            #insert new withdrawal transaction into database
            db.session.execute(
                text("INSERT INTO trans (date, trans_key, amount, currency, user_id, trans_id, trans_status, trans_details, trans_details_link, category) VALUES (:date, :trans_key, :amount, :currency, :user_id, :trans_id, :trans_status, :trans_details, :trans_details_link, :category)"),
                  {"date": date,"trans_key":trans_key, "amount": amount, "currency": currency, "user_id": user_id, "trans_id": trans_id, "trans_status": "withdraw", "trans_details": trans_details, "trans_details_link": trans_details_link, "category":category}
            )
            db.session.commit() #commit transaction to database

            try:
                #get existing networth for user and currency
                networth_db = db.session.execute(
                    text("SELECT networth_id, total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                    {"user_id": user_id, "currency": currency}
                ).fetchone()
                networth_id = networth_db[0] #get networth id
                total = float(networth_db[1]) #get current total

                new_total_calc = total - amount #subtract withdrawal amount from total
                
                #to make sure that the networth is calculated correctly and there is no unexpected error happened
                new_total = recalculate_networth(user_id, new_total_calc, currency) #recalculate networth

                #update networth in database
                db.session.execute(
                    text("UPDATE networth SET total = :total WHERE networth_id = :networth_id"),
                    {"total" :new_total, "networth_id": networth_id}
                )
                db.session.commit() #commit networth update

            except:
                error = "You don't have money from that currency!" #currency not available error
            return redirect("/home") #redirect to home page

@transactions_bp.route("/show_trans", methods=["GET"])
def show_trans():
    """Display paginated transactions for the logged-in user."""
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

        trans_db, to_date,from_date, total_pages, page = trans(user_id) #get paginated transactions

        return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, to_date=to_date, from_date=from_date, total_pages=total_pages,page=page, form=CSRFForm()) #render transactions page

@transactions_bp.route("/edit_trans", methods=["POST", "GET"])
def edit_trans():
    """Edit an existing transaction for the logged-in user."""
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
            trans_key = request.args.get("trans_key") #get transaction key from url parameters
            #get transaction data from database
            trans_db = db.session.execute(
                text("SELECT * FROM trans WHERE trans_key = :trans_key"),
                {"trans_key" :trans_key}
            ).fetchall()[0]
            total_favorite_currency, favorite_currency = show_networth() #get user networth and favorite currency
            total_favorite_currency = f"{total_favorite_currency:,.2f}" #format networth with commas
            return render_template("edit_trans.html",
                                    trans_db = trans_db,
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    currency = trans_db[3]) #render edit transaction page

        else: #handle post request

            trans_key = request.form.get("trans_key") #get transaction key from form
            currency = request.form.get("currency") #get currency from form
            date = request.form.get("date") #get date from form
            amount = request.form.get("amount") #get amount from form
            trans_details = request.form.get("trans_details") #get transaction details from form
            trans_details_link = request.form.get("trans_details_link") #get transaction link from form
            category = request.form.get("category") #get category from form
            
            print(trans_key) #debug print for transaction key
            #get current transaction data from database
            amount_currency_db = db.session.execute(
                text("SELECT amount, currency, trans_status FROM trans WHERE trans_key = :trans_key"),
                {"trans_key" :trans_key}
            ).fetchone()

            amount_db = float(amount_currency_db[0]) #get original amount
            status_db = amount_currency_db[2] #get transaction status

            if currency in select_currencies(user_id): #check if user has this currency
                #get current balance for the currency
                total_db = db.session.execute(
                    text("SELECT total from networth WHERE user_id = :user_id and currency = :currency"),
                    {"user_id" :user_id, "currency" :currency}
                ).fetchone()[0]
            else:
                total_db = 0 #set to zero if currency not found

            total_db = float(total_db) #convert to float

            if status_db == "withdraw": #reverse original withdrawal
                total_db += amount_db #add back original amount
                total = total_db - float(amount) #subtract new amount

            elif status_db == "deposit": #reverse original deposit
                total_db -= amount_db #subtract original amount
                total = total_db + float(amount) #add new amount
            
            if total < 0: #check if resulting balance would be negative
                error = "you don't have enough money from this currency!" #insufficient funds error
                trans_db = db.session.execute(
                    text("SELECT * FROM trans WHERE trans_key = :trans_key"),
                    {"trans_key" :trans_key}
                ).fetchall()[0]
                total_favorite_currency, favorite_currency = show_networth()
                total_favorite_currency = f"{total_favorite_currency:,.2f}"
                return render_template("edit_trans.html", 
                                     trans_db = trans_db, 
                                     user_photo_path=user_photo_path, 
                                     error=error, 
                                     total_favorite_currency=total_favorite_currency, 
                                     favorite_currency=favorite_currency, 
                                     form=CSRFForm(),
                                     available_currencies = get_app_currencies())

            #update transaction in database
            db.session.execute(
                text("UPDATE trans SET  date = :date, trans_details = :trans_details, trans_details_link = :trans_details_link, amount = :amount, category = :category WHERE trans_key = :trans_key"),
                {"date" :date, "trans_details" :trans_details, "trans_details_link" :trans_details_link, "amount" :amount, "trans_key" :trans_key, "category":category}
            )
            db.session.commit() #commit transaction update

            #to make sure that the networth is calculated correctly and there is no unexpected error happened
            new_total = recalculate_networth(user_id, total, currency) #recalculate networth

            #update networth in database
            db.session.execute(
                text("UPDATE networth SET total = :total WHERE user_id = :user_id and currency = :currency"),
                {"total" :new_total, "user_id" :user_id, "currency" :currency}
            )
            db.session.commit() #commit networth update

            trans_db, to_date,from_date, total_pages, page = trans(user_id) #get updated transactions

            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, to_date =to_date ,from_date=from_date, total_pages=total_pages, page=page, form=CSRFForm()) #render updated transactions page

@transactions_bp.route("/delete_trans", methods=["POST"])
def delete_trans():
    """Delete a transaction and move it to trash."""
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
        trans_key = request.form.get("trans_key") #get transaction key from form
        #get transaction data for deletion
        trans_db = db.session.execute(
            text("SELECT amount, currency, trans_status FROM trans WHERE trans_key = :trans_key"),
            {"trans_key" :trans_key}
        ).fetchone()

        amount_db = trans_db[0] #get transaction amount
        currency_db = trans_db[1] #get transaction currency
        trans_status_db = trans_db[2] #get transaction status

        #get current balance for the currency
        total_db = db.session.execute(
            text("SELECT total FROM networth WHERE user_id = :user_id and currency = :currency"),
            {"user_id" :user_id, "currency" :currency_db}
        ).fetchone()[0]

        if trans_status_db == "deposit": #reversing a deposit
            total = total_db - float(amount_db) #subtract amount from balance
            if total < 0: #check if balance would be negative
                error = "You can't delete this transaction" #cannot delete error
                trans_db = db.session.execute(
                    text("SELECT * FROM trans WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchall()
                trans_db, to_date,from_date, total_pages, page = trans(user_id) 

                return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, page = page,total_pages=total_pages,to_date=to_date, from_date=from_date,error=error, form=CSRFForm())

        elif trans_status_db == "withdraw": #reversing a withdrawal
            total = total_db + float(amount_db) #add amount back to balance

        #get transaction data before deletion
        trans_data_db = db.session.execute(
                text("SELECT currency, date, amount, trans_status, trans_details, trans_details_link, category FROM trans WHERE user_id = :user_id AND trans_key = :trans_key"),
                {"user_id": user_id, "trans_key" :trans_key}
            ).fetchone()
        
        currency = trans_data_db[0] #get currency
        date = trans_data_db[1] #get date
        amount = trans_data_db[2] #get amount
        trans_status = trans_data_db[3] #get status
        trans_details = trans_data_db[4] #get details
        trans_details_link = trans_data_db[5] #get link
        category = trans_data_db[6] #get category

        #get the last trash id for the user
        try:
            last_trans_trash_id = db.session.execute(
                    text("SELECT MAX(trans_trash_id) FROM trans_trash WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()[0]
            trans_trash_id = last_trans_trash_id + 1 #increment for new trash item
        except:
            trans_trash_id = 1 #first trash item for user

        #get the last trash key in the database
        try:
            last_trans_trash_key = db.session.execute(
                text("SELECT MAX(trans_trash_key) FROM trans_trash")
            ).fetchone()[0]
            trans_trash_key = last_trans_trash_key + 1 #increment for new trash item
        except:
            trans_trash_key = 1 #first trash item in database

        #insert transaction into trash table
        db.session.execute(
            text("INSERT INTO trans_trash (trans_trash_key, trans_trash_id, user_id, currency, date, amount, trans_status, trans_details, trans_details_link, category) VALUES(:trans_trash_key, :trans_trash_id, :user_id, :currency, :date, :amount, :trans_status, :trans_details, :trans_details_link, :category)"),
            {"trans_trash_key" :trans_trash_key, "trans_trash_id": trans_trash_id, "user_id": user_id, "currency": currency, "date": date, "amount": amount, "trans_status": trans_status, "trans_details": trans_details, "trans_details_link": trans_details_link, "category":category}
        )
        db.session.commit() #commit trash insertion

        #delete transaction from main table
        db.session.execute(
            text("DELETE FROM trans WHERE trans_key = :trans_key"),
            {"trans_key" :trans_key}
        )
        db.session.commit() #commit transaction deletion

        #to make sure that the networth is calculated correctly and there is no unexpected error happened
        total = recalculate_networth(user_id, total, currency) #recalculate networth

        #update networth in database
        db.session.execute(
            text("UPDATE networth SET total = :total WHERE user_id = :user_id AND currency = :currency"),
            {"total" :total, "user_id" :user_id, "currency" :currency_db}
        )
        db.session.commit() #commit networth update

        #update any wishlist items linked to this transaction
        db.session.execute(
            text("UPDATE wishlist SET status = :status WHERE trans_key = :trans_key"),
            {"status" :"pending", "trans_key" :trans_key}
        )
        db.session.commit() #commit wishlist update

        trans_db, to_date,from_date, total_pages, page = trans(user_id) #get updated transactions

        return render_template("show_trans.html", trans_db=trans_db, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, page = page,total_pages=total_pages,to_date=to_date, from_date=from_date, form=CSRFForm()) #render updated transactions page


@transactions_bp.route("/trash_trans", methods=["GET", "POST"])
def trash_trans():
    """Show transaction trash or restore a transaction from trash."""
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

            #get all trash items for user
            trash_trans_data = db.session.execute(
                text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_trans_data=trash_trans_data, form=CSRFForm()) #render trash page

        else: #handle post request (restore transaction)

            trans_trash_key = request.form.get("trans_trash_key") #get trash key from form
            #get trash item data
            trash_trans_data = db.session.execute(
                text("SELECT currency, date, amount, trans_status, trans_details, trans_details_link, category FROM trans_trash WHERE user_id = :user_id AND trans_trash_key = :trans_trash_key"),
                {"user_id" :user_id, "trans_trash_key" :trans_trash_key}
            ).fetchone()

            #get the last transaction id for the user
            try:
                last_trans_id = db.session.execute(
                        text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                trans_id = last_trans_id + 1 #increment for restored transaction
            except:
                trans_id = 1 #first transaction for user

            #get the last transaction key in the database
            try:
                last_trans_key = db.session.execute(
                    text("SELECT MAX(trans_key) FROM trans")
                ).fetchone()[0]
                trans_key = last_trans_key + 1 #increment for restored transaction
            except:
                trans_key = 1 #first transaction in database

            currency = trash_trans_data[0] #get currency
            date = trash_trans_data[1] #get date
            amount = trash_trans_data[2] #get amount
            trans_status = trash_trans_data[3] #get status
            trans_details = trash_trans_data[4] #get details
            trans_details_link = trash_trans_data[5] #get link
            category = trash_trans_data[6] #get category

            #restore transaction to main table
            db.session.execute(
                text("INSERT INTO trans (trans_key, trans_id, user_id, currency, date, amount, trans_status, trans_details, trans_details_link, category) VALUES (:trans_key, :trans_id, :user_id, :currency, :date, :amount, :trans_status, :trans_details, :trans_details_link, :category)"),
                {"trans_key": trans_key, "trans_id": trans_id, "user_id" :user_id, "currency" :currency, "date" :date, "amount" :amount, "trans_status" :trans_status, "trans_details" :trans_details, "trans_details_link" :trans_details_link, "category":category}
            )
            db.session.commit() #commit transaction restoration

            #get current balance for the currency
            total_db = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id and currency = :currency"),
                {"user_id" :user_id, "currency" :currency}
            ).fetchone()[0]

            if trans_status == "deposit": #restoring a deposit
                total = total_db + float(amount) #add amount to balance
            elif trans_status == "withdraw": #restoring a withdrawal
                total = total_db - float(amount) #subtract amount from balance

            #to make sure that the networth is calculated correctly and there is no unexpected error happened
            total = recalculate_networth(user_id, total, currency) #recalculate networth

            #update networth in database
            db.session.execute(
                text("UPDATE networth SET total = :total WHERE user_id = :user_id AND currency = :currency"),
                {"total" :total, "user_id" :user_id, "currency" :currency}
            )
            db.session.commit() #commit networth update

            #delete item from trash
            db.session.execute(
                text("DELETE FROM trans_trash WHERE trans_trash_key = :trans_trash_key"),
                {"trans_trash_key" :trans_trash_key}
            )
            db.session.commit() #commit trash deletion

            #get updated trash data
            trash_trans_data = db.session.execute(
                text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_trans_data=trash_trans_data, form=CSRFForm()) #render updated trash page

@transactions_bp.route("/delete_trash_trans", methods=["POST"])
def delete_trash_trans():
    """Permanently delete a transaction from trash."""
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

        trans_trash_key = request.form.get("trans_trash_key") #get trash key from form

        #permanently delete item from trash
        db.session.execute(
            text("DELETE FROM trans_trash WHERE trans_trash_key = :trans_trash_key"),
            {"trans_trash_key" :trans_trash_key}
        )
        db.session.commit() #commit permanent deletion

        #get updated trash data
        trash_trans_data = db.session.execute(
            text("SELECT * FROM trans_trash WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchall()

        return render_template("trash_trans.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_trans_data=trash_trans_data, form=CSRFForm()) #render updated trash page

@transactions_bp.route("/export_trans", methods=["GET"])
def export():
    """Export user transactions to CSV format."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:
        user_id = session.get("user_id") #get user id from session
        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        #get the same filtered transactions as show_trans
        trans_db, to_date, from_date, total_pages, page = trans(user_id) #get transactions for export

        #create CSV data
        output = io.StringIO() #create string buffer for csv
        writer = csv.writer(output) #create csv writer
        
        # CSV Headers
        headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Receipt Link', 'Transaction ID'] #csv headers
        writer.writerow(headers) #write headers to csv

        # Write transaction data
        for transaction in trans_db: #iterate through transactions
            writer.writerow([
                transaction[4].strftime('%Y-%m-%d') if transaction[4] else '',  #date #format date
                transaction[6] if transaction[6] else '',  # Type (deposit/withdraw) #transaction type
                float(transaction[5]) if transaction[5] else 0,  # Amount #transaction amount
                transaction[3] if transaction[3] else '',  # Currency #transaction currency
                transaction[9] if transaction[9] else 'No Category',  # Category #transaction category
                transaction[7] if transaction[7] else 'No Description',  # Description #transaction description
                transaction[8] if transaction[8] else '',  # Receipt Link #transaction link
                transaction[1] if transaction[1] else ''  # Transaction Key #transaction id
            ]) #write transaction row to csv

        # Prepare response
        output.seek(0) #reset buffer position
        csv_data = output.getvalue() #get csv data as string
        output.close() #close buffer

        #create file download response
        response = Response(
            csv_data,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=transactions_{from_date}_to_{to_date}.csv'
            }
        )

        return response #return csv file download

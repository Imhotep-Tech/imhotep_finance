from flask import render_template, redirect, session, request, Blueprint
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from utils.user_info import select_user_data, select_user_photo, select_years_wishlist, wishlist_page, get_app_currencies
from utils.currencies import show_networth, select_currencies
from datetime import date
from extensions import db
from config import CSRFForm
from utils.recalculate_networth import recalculate_networth

wishlist_bp = Blueprint('wishlist', __name__)

# a route to get the wishist by a specific year
@wishlist_bp.route("/filter_year_wishlist", methods=["GET"])
def filter_year_wishlist():
        """Filter wishlist items by a specific year."""
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
            year = request.args.get("year") #get year from url parameters
            
            if year is None: #check if no year provided
                today = date.today() #get current date
                year = today.year #use current year

            #get wishlist items for specified year
            wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id and year = :year ORDER BY wish_id"),
                        {"user_id" :user_id, "year" :year}
                    ).fetchall()

            all_years = select_years_wishlist(user_id) #get all years with wishlist items
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#a route to add a wish to the database
@wishlist_bp.route("/add_wish", methods=["GET", "POST"])
def add_wish():
    """Add a new wish item to the user's wishlist."""
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
            year = request.form.get("year") #get year from form
            return render_template("add_wish.html",
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    currencies_data = get_app_currencies()) #render add wish page
        else: #handle post request
            user_id = session.get("user_id") #get user id from session
            price = request.form.get("price") #get price from form
            currency = request.form.get("currency") #get currency from form
            wish_details = request.form.get("details") #get wish details from form
            link = request.form.get("link") #get link from form
            year = request.form.get("year") #get year from form
            status = "pending" #set initial status to pending

            #get the last wish id for the user
            try:
                last_wish_id = db.session.execute(
                        text("SELECT MAX(wish_id) FROM wishlist WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                wish_id = last_wish_id + 1 #increment for new wish
            except:
                wish_id = 1 #first wish for user

            #get the last wish key in the database
            try:
                last_wish_key = db.session.execute(
                    text("SELECT MAX(wish_key) FROM wishlist")
                ).fetchone()[0]
                wish_key = last_wish_key + 1 #increment for new wish
            except:
                wish_key = 1 #first wish in database

            #insert new wish into database
            db.session.execute(
                text("INSERT INTO wishlist (wish_key, wish_id, user_id, price, currency, wish_details, link,year, status) VALUES (:wish_key, :wish_id, :user_id, :price, :currency, :wish_details, :link,:year, :status)"),
                {"wish_key" :wish_key, "wish_id" :wish_id, "user_id" :user_id, "price" :price, "currency" :currency, "wish_details" :wish_details, "link" :link, "year" :year, "status" :status}
            )
            db.session.commit() #commit changes to database
            done = "wish added successfully!" #success message

            #get updated wishlist for the year
            wishlist_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                {"user_id" :user_id , "year" :year}
            ).fetchall()

            all_years = select_years_wishlist(user_id) #get all years with wishlist items
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, done = done, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

# a route to check and uncheck a wish from the wishlist as done or not
#also this route updates the transactions and the total networth of the user
@wishlist_bp.route("/check_wish", methods=["POST"])
def check_wish():
    """Mark a wish as done/pending and update user's balance accordingly."""
    if not session.get("logged_in"): #check if user is logged in
        return redirect("/login_page") #redirect to login if not logged in
    else:

        try:
            user_photo_path = select_user_photo() #get user profile picture path
        except OperationalError:
            error = "Welcome Back" #database error message
            return render_template('error.html', error=error, form=CSRFForm())

        user_id = session.get("user_id") #get user id from session
        wish_key = request.form.get("wish_key") #get wish key from form

        #get wish data from database
        wishlist_data_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE wish_key = :wish_key"),
                {"wish_key" :wish_key}
            ).fetchone()

        currency = wishlist_data_db[3] #get currency
        amount = wishlist_data_db[4] #get amount
        status = wishlist_data_db[5] #get current status
        link = wishlist_data_db[6] #get link
        wish_details = wishlist_data_db[7] #get wish details
        year = wishlist_data_db[8] #get year
        current_date = date.today() #get current date

        if currency in select_currencies(user_id): #check if user has this currency

            #get user's current balance for this currency
            total_db = db.session.execute(
                text("SELECT total FROM networth WHERE user_id = :user_id AND currency = :currency"),
                {"user_id" :user_id, "currency" :currency}
            ).fetchone()[0]

            if float(total_db) < float(amount) and status == "pending": #check if insufficient balance for pending wish
                error = "You don't have on your balance this currency!" #insufficient balance error
                year, wishlist_db = wishlist_page(user_id)
                all_years = select_years_wishlist(user_id)
                total_favorite_currency, favorite_currency = show_networth()
                total_favorite_currency = f"{total_favorite_currency:,.2f}"
                return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
            else:
                #get the last transaction key in the database
                try:
                    last_trans_key = db.session.execute(
                        text("SELECT MAX(trans_key) FROM trans")
                    ).fetchone()[0]
                    trans_key = last_trans_key + 1 #increment for new transaction
                except:
                    trans_key = 1 #first transaction in database

                if status == "pending": #marking wish as done
                    new_total = float(total_db) - float(amount) #subtract amount from balance
                    new_status = "done" #set status to done

                    #get the last transaction id for the user
                    try:
                        last_trans_id = db.session.execute(
                                text("SELECT MAX(trans_id) FROM trans WHERE user_id = :user_id"),
                                {"user_id": user_id}
                            ).fetchone()[0]
                        trans_id = last_trans_id + 1 #increment for new transaction
                    except:
                        trans_id = 1 #first transaction for user

                    #insert withdrawal transaction for the wish
                    db.session.execute(
                        text("INSERT INTO trans (currency, amount, trans_details, trans_details_link, user_id, trans_id, trans_key, trans_status, date) VALUES(:currency, :amount, :trans_details, :trans_details_link, :user_id, :trans_id, :trans_key, :trans_status, :date)"),
                        {"currency" :currency, "amount" :amount, "trans_details" :wish_details, "trans_details_link" :link, "user_id" :user_id, "trans_id" :trans_id, "trans_key" :trans_key, "trans_status" :"withdraw", "date" :current_date}
                    )
                    db.session.commit() #commit transaction

                    #to make sure that the networth is calculated correctly and there is no unexpected error happened
                    new_total = recalculate_networth(user_id, new_total, currency) #recalculate networth

                    #update user's networth
                    db.session.execute(
                        text("UPDATE networth SET total = :total WHERE currency = :currency AND user_id = :user_id"),
                        {"total" :new_total,"currency" :currency, "user_id" :user_id}
                    )
                    db.session.commit() #commit networth update

                    #update wish status and link to transaction
                    db.session.execute(
                        text("UPDATE wishlist SET trans_key = :trans_key, status = :status WHERE wish_key = :wish_key"),
                        {"trans_key" :trans_key,"status" :new_status, "wish_key" :wish_key}
                    )
                    db.session.commit() #commit wish update

                    #get updated wishlist for the year
                    wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                        {"user_id" :user_id , "year" :year}
                    ).fetchall()

                    all_years = select_years_wishlist(user_id) #get all years with wishlist items
                    total_favorite_currency, favorite_currency = show_networth()
                    total_favorite_currency = f"{total_favorite_currency:,.2f}"
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                elif status == "done": #marking wish as pending again
                    new_status = "pending" #set status to pending
                    new_total = float(total_db) + float(amount) #add amount back to balance

                    #get transaction key linked to this wish
                    trans_key = db.session.execute(
                        text("SELECT trans_key FROM wishlist WHERE wish_key = :wish_key"),
                        {"wish_key" :wish_key}
                    ).fetchone()[0]

                    #delete the transaction linked to this wish
                    db.session.execute(
                        text("DELETE FROM trans WHERE trans_key = :trans_key"),
                        {"trans_key" :trans_key}
                    )
                    db.session.commit() #commit transaction deletion

                    #to make sure that the networth is calculated correctly and there is no unexpected error happened
                    new_total = recalculate_networth(user_id, new_total, currency) #recalculate networth

                    #update user's networth
                    db.session.execute(
                        text("UPDATE networth SET total = :total WHERE currency = :currency AND user_id = :user_id"),
                        {"total" :new_total,"currency" :currency, "user_id" :user_id}
                    )
                    db.session.commit() #commit networth update

                    #update wish status and remove transaction link
                    db.session.execute(
                        text("UPDATE wishlist SET trans_key = :trans_key, status = :status WHERE wish_key = :wish_key"),
                        {"trans_key" :None, "status" :new_status, "wish_key" :wish_key}
                    )
                    db.session.commit() #commit wish update

                    #get updated wishlist for the year
                    wishlist_db = db.session.execute(
                        text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                        {"user_id" :user_id , "year" :year}
                    ).fetchall()
                    all_years = select_years_wishlist(user_id) #get all years with wishlist items
                    total_favorite_currency, favorite_currency = show_networth()
                    total_favorite_currency = f"{total_favorite_currency:,.2f}"
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        else:
            error = "You don't have on your balance enough of this currency!" #currency not available error
            year, wishlist_db = wishlist_page(user_id)
            all_years = select_years_wishlist(user_id)
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

# a route to edit a wishlist that isn't completed yet
@wishlist_bp.route("/edit_wish", methods=["GET", "POST"])
def edit_wish():
    """Edit an existing wish item that hasn't been completed yet."""
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
            wish_key = request.args.get("wish_key") #get wish key from url parameters
            #get wish data from database
            wish_db = db.session.execute(
                text("SELECT year, price, currency, wish_details, link, wish_key FROM wishlist WHERE wish_key = :wish_key"),
                {"wish_key" :wish_key}
            ).fetchone()
            return render_template("edit_wish.html",
                                    wish_db=wish_db,
                                    user_photo_path=user_photo_path,
                                      total_favorite_currency=total_favorite_currency,
                                        favorite_currency=favorite_currency,
                                          form=CSRFForm(),
                                          currencies_data=get_app_currencies()) #render edit wish page
        else: #handle post request

            wish_key = request.form.get("wish_key") #get wish key from form
            year = request.form.get("year") #get year from form
            price = request.form.get("price") #get price from form
            currency = request.form.get("currency") #get currency from form
            details = request.form.get("details") #get details from form
            link = request.form.get("link") #get link from form

            #update wish in database
            db.session.execute(
                text("UPDATE wishlist SET year = :year, price = :price, currency= :currency, wish_details = :wish_details, link = :link WHERE wish_key = :wish_key"),
                {"year" :year, "price" :price, "currency" :currency, "wish_details" :details, "link" :link, "wish_key" :wish_key}
            )
            db.session.commit() #commit changes to database

            #get updated wishlist for the year
            wishlist_db = db.session.execute(
                text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
                {"user_id" :user_id , "year" :year}
            ).fetchall()

            all_years = select_years_wishlist(user_id) #get all years with wishlist items
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#delete a wish that isn't completed yet
@wishlist_bp.route("/delete_wish", methods=["POST"])
def delete_wish():
    """Delete a wish item and move it to trash."""
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
        wish_key = request.form.get("wish_key") #get wish key from form

        #get wish data before deletion
        wish_data_db = db.session.execute(
                        text("SELECT currency, price, link, wish_details, year FROM wishlist WHERE user_id = :user_id AND wish_key = :wish_key"),
                        {"user_id": user_id, "wish_key" :wish_key}
                    ).fetchone()

        currency = wish_data_db[0] #get currency
        price = wish_data_db[1] #get price
        link = wish_data_db[2] #get link
        wish_details = wish_data_db[3] #get wish details
        year_db = wish_data_db[4] #get year

        #get the last trash id for the user
        try:
            last_wish_trash_id = db.session.execute(
                    text("SELECT MAX(wish_trash_id) FROM wishlist_trash WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()[0]
            wish_trash_id = last_wish_trash_id + 1 #increment for new trash item
        except:
            wish_trash_id = 1 #first trash item for user

        #get the last trash key in the database
        try:
            last_wish_trash_key = db.session.execute(
                text("SELECT MAX(wish_trash_key) FROM wishlist_trash")
            ).fetchone()[0]
            wish_trash_key = last_wish_trash_key + 1 #increment for new trash item
        except:
            wish_trash_key = 1 #first trash item in database

        #insert wish into trash table
        db.session.execute(
            text("INSERT INTO wishlist_trash (wish_trash_key, wish_trash_id, user_id, currency, price, link, wish_details, year) VALUES(:wish_trash_key, :wish_trash_id, :user_id, :currency, :price, :link, :wish_details, :year_db)"),
            {"wish_trash_key" :wish_trash_key, "wish_trash_id": wish_trash_id, "user_id": user_id, "currency": currency, "price": price, "link": link, "wish_details": wish_details, "year_db": year_db}
        )
        db.session.commit() #commit trash insertion

        #delete wish from main wishlist table
        db.session.execute(
            text("DELETE FROM wishlist WHERE wish_key = :wish_key"),
            {"wish_key" :wish_key}
        )
        db.session.commit() #commit wish deletion

        year, wishlist_db = wishlist_page(user_id) #get current year wishlist
        all_years = select_years_wishlist(user_id) #get all years with wishlist items
        return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#a route to show the current items on the trash of the wishlist
# if it's a post request then it can restore an item from the trash
@wishlist_bp.route("/trash_wishlist", methods=["GET", "POST"])
def trash_wishlist():
    """Show wishlist trash or restore an item from trash."""
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
            trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm()) #render trash page

        else: #handle post request (restore item)

            wish_trash_key = request.form.get("wish_trash_key") #get trash key from form
            #get trash item data
            trash_wishlist_data = db.session.execute(
                text("SELECT currency, price, link, wish_details, year FROM wishlist_trash WHERE user_id = :user_id AND wish_trash_key = :wish_trash_key"),
                {"user_id" :user_id, "wish_trash_key" :wish_trash_key}
            ).fetchone()
            #get the last wish id for the user
            try:
                last_wish_id = db.session.execute(
                        text("SELECT MAX(wish_id) FROM wishlist WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                wish_id = last_wish_id + 1 #increment for restored wish
            except:
                wish_id = 1 #first wish for user

            #get the last wish key in the database
            try:
                last_wish_key = db.session.execute(
                    text("SELECT MAX(wish_key) FROM wishlist")
                ).fetchone()[0]
                wish_key = last_wish_key + 1 #increment for restored wish
            except:
                wish_key = 1 #first wish in database

            currency = trash_wishlist_data[0] #get currency
            price = trash_wishlist_data[1] #get price
            link = trash_wishlist_data[2] #get link
            wish_details = trash_wishlist_data[3] #get wish details
            year = trash_wishlist_data[4] #get year

            #restore wish to main wishlist table
            db.session.execute(
                text("INSERT INTO wishlist (wish_key, wish_id, user_id, currency, price, link, wish_details, year, status) VALUES (:wish_key, :wish_id, :user_id, :currency, :price, :link, :wish_details, :year, :status)"),
                {"wish_key": wish_key, "wish_id": wish_id, "user_id" :user_id, "currency" :currency, "price" :price, "link" :link, "wish_details" :wish_details, "year" :year, "status" :"pending"}
            )
            db.session.commit() #commit wish restoration

            #delete item from trash
            db.session.execute(
                text("DELETE FROM wishlist_trash WHERE wish_trash_key = :wish_trash_key"),
                {"wish_trash_key" :wish_trash_key}
            )
            db.session.commit() #commit trash deletion

            #get updated trash data
            trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm()) #render updated trash page

# a route to delete something permenantly
@wishlist_bp.route("/delete_trash_wishlist", methods=["POST"])
def delete_trash_wishlist():
    """Permanently delete an item from wishlist trash."""
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

        wish_trash_key = request.form.get("wish_trash_key") #get trash key from form
        #permanently delete item from trash
        db.session.execute(
            text("DELETE FROM wishlist_trash WHERE wish_trash_key = :wish_trash_key"),
            {"wish_trash_key" :wish_trash_key}
        )
        db.session.commit() #commit permanent deletion

        #get updated trash data
        trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
        ).fetchall()

        return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm()) #render updated trash page

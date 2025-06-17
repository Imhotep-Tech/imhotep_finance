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
        if not session.get("logged_in"):
            return redirect("/login_page")
        else:
            try:
                user_photo_path = select_user_photo()
            except OperationalError:
                error = "Welcome Back"
                return render_template('error.html', error=error, form=CSRFForm())

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
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#a route to add a wish to the database
@wishlist_bp.route("/add_wish", methods=["GET", "POST"])
def add_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            year = request.form.get("year")
            return render_template("add_wish.html",
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    currencies_data = get_app_currencies())
        else:
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
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, done = done, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

# a route to check and uncheck a wish from the wishlist as done or not
#also this route updates the transactions and the total networth of the user
@wishlist_bp.route("/check_wish", methods=["POST"])
def check_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

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

            if float(total_db) < float(amount) and status == "pending":
                error = "You don't have on your balance this currency!"
                year, wishlist_db = wishlist_page(user_id)
                all_years = select_years_wishlist(user_id)
                total_favorite_currency, favorite_currency = show_networth()
                total_favorite_currency = f"{total_favorite_currency:,.2f}"
                return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())
            else:
                try:
                    last_trans_key = db.session.execute(
                        text("SELECT MAX(trans_key) FROM trans")
                    ).fetchone()[0]
                    trans_key = last_trans_key + 1
                except:
                    trans_key = 1

                if status == "pending":
                    new_total = float(total_db) - float(amount)
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

                    #to make sure that the networth is calculated correctly and there is no unexpected error happened
                    new_total = recalculate_networth(user_id, new_total, currency)

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
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

                elif status == "done":
                    new_status = "pending"
                    new_total = float(total_db) + float(amount)

                    trans_key = db.session.execute(
                        text("SELECT trans_key FROM wishlist WHERE wish_key = :wish_key"),
                        {"wish_key" :wish_key}
                    ).fetchone()[0]

                    db.session.execute(
                        text("DELETE FROM trans WHERE trans_key = :trans_key"),
                        {"trans_key" :trans_key}
                    )
                    db.session.commit()

                    #to make sure that the networth is calculated correctly and there is no unexpected error happened
                    new_total = recalculate_networth(user_id, new_total, currency)

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
                    return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

        else:
            error = "You don't have on your balance enough of this currency!"
            year, wishlist_db = wishlist_page(user_id)
            all_years = select_years_wishlist(user_id)
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, error = error, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

# a route to edit a wishlist that isn't completed yet
@wishlist_bp.route("/edit_wish", methods=["GET", "POST"])
def edit_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            wish_key = request.args.get("wish_key")
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
                                          currencies_data=get_app_currencies())
        else:

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
            return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#delete a wish that isn't completed yet
@wishlist_bp.route("/delete_wish", methods=["POST"])
def delete_wish():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

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
        return render_template("wishlist.html", user_photo_path=user_photo_path, wishlist_db=wishlist_db, year=year, all_years=all_years, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, form=CSRFForm())

#a route to show the current items on the trash of the wishlist
# if it's a post request then it can restore an item from the trash
@wishlist_bp.route("/trash_wishlist", methods=["GET", "POST"])
def trash_wishlist():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"
        user_id = session.get("user_id")
        if request.method == "GET":
            trash_wishlist_data = db.session.execute(
                text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchall()

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm())

        else:

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

            return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm())

# a route to delete something permenantly
@wishlist_bp.route("/delete_trash_wishlist", methods=["POST"])
def delete_trash_wishlist():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:

        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

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

        return render_template("trash_wishlist.html",user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, trash_wishlist_data=trash_wishlist_data, form=CSRFForm())

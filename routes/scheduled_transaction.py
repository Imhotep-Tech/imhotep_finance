from flask import render_template, redirect, session, request, Blueprint
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from extensions import db
from config import CSRFForm, Config
from utils.user_info import select_user_photo, trans, get_app_currencies, get_user_categories, select_scheduled_trans
from utils.currencies import show_networth
from datetime import datetime

scheduled_transactions_bp = Blueprint('scheduled_transactions', __name__)

@scheduled_transactions_bp.route("/add_scheduled_transaction", methods=["POST", "GET"])
def add_scheduled_transaction():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())
        
        user_id = session.get("user_id")
        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"

        user_categories = get_user_categories("ANY", user_id)

        if request.method == "GET":
            return render_template("add_scheduled_transaction.html",
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    available_currencies=get_app_currencies(),
                                    user_categories=user_categories)
        else:

            day_of_month = request.form.get("day_of_month")
            amount = float(request.form.get("amount"))
            currency = request.form.get("currency")
            user_id = session.get("user_id")
            scheduled_trans_details = request.form.get("scheduled_trans_details")
            category = request.form.get("category")
            scheduled_trans_status = request.form.get("scheduled_trans_status")

            if currency is None or amount is None :
                error = "You have to choose the currency!"
                return render_template("deposit.html", error = error,total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency,  user_photo_path=user_photo_path, form=CSRFForm())

            try:
                last_scheduled_trans_id = db.session.execute(
                        text("SELECT MAX(scheduled_trans_id) FROM scheduled_trans WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()[0]
                scheduled_trans_id = last_scheduled_trans_id + 1
            except:
                scheduled_trans_id = 1

            try:
                last_scheduled_trans_key = db.session.execute(
                    text("SELECT MAX(scheduled_trans_key) FROM scheduled_trans")
                ).fetchone()[0]
                scheduled_trans_key = last_scheduled_trans_key + 1
            except:
                scheduled_trans_key = 1

            db.session.execute(
                text('''
                    INSERT INTO scheduled_trans
                    (date, scheduled_trans_key, amount, currency, user_id, scheduled_trans_id, scheduled_trans_status, scheduled_trans_details, category)
                    VALUES (:date, :scheduled_trans_key, :amount, :currency, :user_id, :scheduled_trans_id, :scheduled_trans_status, :scheduled_trans_details, :category)
                    '''),
                    {"date": day_of_month,
                    "scheduled_trans_key":scheduled_trans_key,
                    "amount": amount,
                    "currency": currency,
                    "user_id": user_id,
                    "scheduled_trans_id": scheduled_trans_id,
                    "scheduled_trans_status": scheduled_trans_status,
                    "scheduled_trans_details": scheduled_trans_details,
                    "category":category}
            )
            db.session.commit()

            return redirect("/home")

@scheduled_transactions_bp.route("/edit_scheduled_trans", methods=["POST", "GET"])
def edit_scheduled_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        user_id = session.get("user_id")
        if request.method == "GET":
            scheduled_trans_key = request.args.get("scheduled_trans_key")
            scheduled_trans_db = db.session.execute(
                text("SELECT * FROM scheduled_trans WHERE scheduled_trans_key = :scheduled_trans_key"),
                {"scheduled_trans_key" :scheduled_trans_key}
            ).fetchall()[0]
            total_favorite_currency, favorite_currency = show_networth()
            total_favorite_currency = f"{total_favorite_currency:,.2f}"
            return render_template("edit_scheduled_trans.html",
                                    scheduled_trans_db = scheduled_trans_db,
                                    user_photo_path=user_photo_path,
                                    total_favorite_currency=total_favorite_currency,
                                    favorite_currency=favorite_currency,
                                    form=CSRFForm(),
                                    currency = scheduled_trans_db[3],
                                    available_currencies=get_app_currencies())

        else:

            scheduled_trans_key = request.form.get("scheduled_trans_key")
            currency = request.form.get("currency")
            date = request.form.get("date")
            amount = request.form.get("amount")
            scheduled_trans_details = request.form.get("scheduled_trans_details")
            scheduled_trans_link = request.form.get("scheduled_trans_link")
            category = request.form.get("category")

            amount_currency_db = db.session.execute(
                text("SELECT amount, currency, scheduled_trans_status FROM scheduled_trans WHERE scheduled_trans_key = :scheduled_trans_key"),
                {"scheduled_trans_key" :scheduled_trans_key}
            ).fetchone()

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
            db.session.commit()

            return redirect("/show_scheduled_trans")

@scheduled_transactions_bp.route("/show_scheduled_trans", methods=["GET"])
def show_scheduled_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        total_favorite_currency, favorite_currency = show_networth()
        total_favorite_currency = f"{total_favorite_currency:,.2f}"

        page = int(request.args.get("page", 1))
        scheduled_trans, total_pages, page = select_scheduled_trans(user_id, page)    

        return render_template("show_scheduled_trans.html", scheduled_trans=scheduled_trans, user_photo_path=user_photo_path, total_favorite_currency=total_favorite_currency, favorite_currency=favorite_currency, total_pages=total_pages,page=page, form=CSRFForm())

@scheduled_transactions_bp.route("/change_status_of_scheduled_trans", methods=["GET"])
def change_status_of_scheduled_trans():
    if not session.get("logged_in"):
        return redirect("/login_page")
    else:
        user_id = session.get("user_id")
        try:
            user_photo_path = select_user_photo()
        except OperationalError:
            error = "Welcome Back"
            return render_template('error.html', error=error, form=CSRFForm())

        scheduled_trans_key = request.args.get("scheduled_trans_key")
        db.session.execute(
            text('''
                UPDATE scheduled_trans SET status = NOT(status) WHERE scheduled_trans_key = :scheduled_trans_key
            '''
            )
            ,{"scheduled_trans_key": scheduled_trans_key}
        )
        db.session.commit()

        return redirect("/show_scheduled_trans")
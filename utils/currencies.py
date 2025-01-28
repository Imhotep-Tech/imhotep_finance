import os
import datetime
import requests
from flask import session
from extensions import db
from sqlalchemy import text
from flask_sqlalchemy import SQLAlchemy

def set_currency_session(favorite_currency):
    primary_api_key = os.getenv('EXCHANGE_API_KEY_PRIMARY')

    data = None
    try:
        response = requests.get(f"https://imhotepexchangeratesapi.pythonanywhere.com/latest_rates/{primary_api_key}/{favorite_currency}")
        data = response.json()
        rate = data["data"]

    except requests.RequestException as e:
        print(f"Failed to fetch exchange rates: {e}")
        return None

    if rate:
        session["rate"] = rate
        today = datetime.datetime.now().date()
        session["rate_date"] = today
        session["favorite_currency"] = favorite_currency
        return rate
    return None

def convert_to_fav_currency(dictionary, user_id):
        favorite_currency = select_favorite_currency(user_id)
        today = datetime.datetime.now().date()
        if session.get('rate_date') != today:

            session.pop('rate', None)
            session.pop('rate_expire', None)
            session.pop('favorite_currency', None)

            rate = set_currency_session(favorite_currency)
            if not rate:
                return None, favorite_currency
        elif session.get('favorite_currency') != favorite_currency:
            session.pop('rate', None)
            session.pop('rate_expire', None)
            session.pop('favorite_currency', None)

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

def select_favorite_currency(user_id):
        favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id" :user_id}
        ).fetchone()[0]
        return favorite_currency
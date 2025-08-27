import os
import datetime
import requests
from django.contrib.auth import get_user_model
from decouple import config
from ..models import Transactions, NetWorth

def get_fav_currency(user):
    return getattr(user, 'favorite_currency', 'USD')

def set_currency_session(request, favorite_currency):
    """Fetch and store exchange rates in Django session for better performance."""
    primary_api_key = config('EXCHANGE_API_KEY_PRIMARY')
    data = None
    try:
        response = requests.get(
            f"https://imhotepexchangeratesapi.pythonanywhere.com/latest_rates/{primary_api_key}/{favorite_currency}"
        )
        data = response.json()
        rate = data.get("data")
    except requests.RequestException as e:
        print(f"Failed to fetch exchange rates: {e}")
        return None

    if rate:
        request.session["rate"] = rate
        today = datetime.datetime.now().date()
        request.session["rate_date"] = str(today)
        request.session["favorite_currency"] = favorite_currency
        return rate
    return None

def convert_to_fav_currency(request, dictionary):
    """Convert amounts in different currencies to user's favorite currency."""
    favorite_currency = get_fav_currency(request.user)
    today = str(datetime.datetime.now().date())
    session = request.session

    if session.get('rate_date') != today:
        session.pop('rate', None)
        session.pop('rate_expire', None)
        session.pop('favorite_currency', None)
        rate = set_currency_session(request, favorite_currency)
        if not rate:
            return None, favorite_currency
    elif session.get('favorite_currency') != favorite_currency:
        session.pop('rate', None)
        session.pop('rate_expire', None)
        session.pop('favorite_currency', None)
        rate = set_currency_session(request, favorite_currency)
        if not rate:
            return None, favorite_currency
    else:
        rate = session.get('rate')
        if rate is None:
            try:
                rate = set_currency_session(request, favorite_currency)
            except Exception:
                return "Error", favorite_currency

    total_favorite_currency = 0
    for currency, amount in dictionary.items():
        if currency in rate and rate[currency]:
            converted_amount = amount / rate[currency]
            total_favorite_currency += converted_amount

    return total_favorite_currency, favorite_currency

def select_currencies(user):
    """Get all currencies that the user has transactions in."""
    #get all currencies user has networth in

    currency_db = NetWorth.objects.filter(user=user)

    currency_all = [] #initialize currency list
    for item in currency_db: #iterate through currency results
        currency_all.append(item['currency']) #add currency to list

    return(currency_all) #return list of user currencies

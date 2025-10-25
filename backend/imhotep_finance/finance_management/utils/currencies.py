import os
import datetime
import requests
from django.contrib.auth import get_user_model
from decouple import config
from transaction_management.models import Transactions, NetWorth

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

def convert_to_fav_currency(request, amounts_not_fav_currency):
    try:
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
        
        if not amounts_not_fav_currency:
            return 0.0, favorite_currency
            
        total_favorite_currency = 0
        for currency, amount in amounts_not_fav_currency.items():
            if currency in rate and rate[currency]:
                converted_amount = amount / rate[currency]
                total_favorite_currency += converted_amount
                
        # Ensure we always return a valid number
        if total_favorite_currency is None:
            total_favorite_currency = 0.0
            
        return total_favorite_currency, favorite_currency
        
    except Exception as e:
        print(f"Currency conversion error: {str(e)}")
        # Return safe defaults
        favorite_currency = getattr(request.user, 'favorite_currency', 'USD') if hasattr(request, 'user') else 'USD'
        return 0.0, favorite_currency

def select_currencies(user):
    """Get all currencies that the user has transactions in."""
    #get all currencies user has networth in

    currency_db = NetWorth.objects.filter(user=user)

    currency_all = [] #initialize currency list
    for item in currency_db: #iterate through currency results
        currency_all.append(item.currency) #use attribute, not dict key

    return(currency_all) #return list of user currencies

def get_allowed_currencies():
    # Validate currency
        return [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'EGP', 'AED', 'SAR', 'KWD', 'QAR',
            'BHD', 'OMR', 'JOD', 'LBP', 'SYP', 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'TRY',
            'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD', 'ALL', 'BAM', 'MDL', 'GEL', 'AMD',
            'AZN', 'KGS', 'KZT', 'UZS', 'TJS', 'TMT', 'MNT', 'KRW', 'THB', 'VND', 'LAK', 'KHR', 'MMK', 'IDR', 'MYR',
            'SGD', 'PHP', 'BND', 'TWD', 'HKD', 'MOP', 'ZAR', 'BWP', 'NAD', 'SZL', 'LSL', 'ZMW', 'ZWL', 'MWK', 'TZS',
            'UGX', 'KES', 'RWF', 'BIF', 'DJF', 'ERN', 'ETB', 'SOS', 'SCR', 'MUR', 'MGA', 'KMF', 'AOA', 'CDF', 'XAF',
            'XOF', 'XPF', 'MAD', 'DZD', 'TND', 'LYD', 'SDG', 'SSP', 'NGN', 'GHS', 'SLE', 'LRD', 'GMD', 'GNF', 'SLL',
            'CVE', 'STN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'UYU', 'GYD', 'SRD', 'VES', 'TTD', 'JMD',
            'BBD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP', 'HTG', 'DOP', 'MXN', 'XCD', 'AWG', 'ANG',
            'FJD', 'PGK', 'SBD', 'VUV', 'WST', 'TOP', 'TVD', 'KID', 'CKD', 'FKP', 'GIP', 'GGP', 'IMP', 'JEP', 'SHP',
            'ISK', 'NOK', 'DKK', 'FOK'
        ]
import os
import datetime
import requests
from django.contrib.auth import get_user_model
from django.utils import timezone
from decouple import config
from transaction_management.models import Transactions, NetWorth
from finance_management.models import BaseExchangeRate

BASE_CURRENCY = 'USD'

def get_fav_currency(user):
    return getattr(user, 'favorite_currency', 'USD')

def fetch_rates_from_api(base_currency=BASE_CURRENCY):
    """Fetch exchange rates from API and return rates dict or None on error."""
    primary_api_key = config('EXCHANGE_API_KEY_PRIMARY')
    try:
        response = requests.get(
            f"https://imhotepexchangeratesapi.pythonanywhere.com/latest_rates/{primary_api_key}/{base_currency}"
        )
        data = response.json()
        rates = data.get("data")
        return rates
    except requests.RequestException as e:
        print(f"Failed to fetch exchange rates from API: {e}")
        return None

def get_or_update_rates(base_currency=BASE_CURRENCY):
    """Get rates from DB, update if older than 1 day, return rates dict or False on error."""
    try:
        rate_obj, created = BaseExchangeRate.objects.get_or_create(base_currency=base_currency)
        
        # Check if rates are older than 1 day
        now = timezone.now()
        if (now - rate_obj.last_updated).days >= 1 or not rate_obj.rates:
            # Fetch new rates from API
            new_rates = fetch_rates_from_api(base_currency)
            if new_rates:
                rate_obj.rates = new_rates
                rate_obj.save()
                return new_rates
            else:
                print(f"API fetch failed, using cached rates from DB")
                return rate_obj.rates if rate_obj.rates else False
        else:
            # Rates are fresh
            return rate_obj.rates if rate_obj.rates else False
    except Exception as e:
        print(f"Error getting/updating rates: {e}")
        return False

def convert_to_fav_currency(user, amounts_not_fav_currency):
    """
    Convert amounts in different currencies to user's favorite currency.
    Uses USD as base currency. Conversion: (amount / rate_from_usd) * rate_to_usd
    Returns: (converted_amount, favorite_currency) or (False, favorite_currency) on error
    """
    try:
        favorite_currency = get_fav_currency(user)
        
        if not amounts_not_fav_currency:
            return 0.0, favorite_currency
        
        # Get rates from DB (with update if stale)
        rates = get_or_update_rates(BASE_CURRENCY)
        
        if rates is False:
            print("No exchange rates available")
            return False, favorite_currency
        
        # Ensure base currency (USD) has rate of 1.0
        rates[BASE_CURRENCY] = 1.0
        
        total_favorite_currency = 0.0
        
        for currency, amount in amounts_not_fav_currency.items():
            if currency not in rates or rates[currency] is None:
                print(f"Rate not available for {currency}")
                continue
            
            if favorite_currency not in rates or rates[favorite_currency] is None:
                print(f"Rate not available for favorite currency {favorite_currency}")
                return False, favorite_currency
            
            # Convert: (amount / rate_from_usd) * rate_to_usd
            converted_amount = (amount / rates[currency]) * rates[favorite_currency]
            total_favorite_currency += converted_amount
        
        return total_favorite_currency, favorite_currency
        
    except Exception as e:
        print(f"Currency conversion error: {str(e)}")
        favorite_currency = getattr(request.user, 'favorite_currency', 'USD') if hasattr(request, 'user') else 'USD'
        return False, favorite_currency

def select_currencies(user):
    """Get all currencies that the user has transactions in."""
    # get all currencies user has networth in
    currency_db = NetWorth.objects.filter(user=user)

    currency_all = []  # initialize currency list
    for item in currency_db:  # iterate through currency results
        currency_all.append(item.currency)  # use attribute, not dict key

    return currency_all  # return list of user currencies

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
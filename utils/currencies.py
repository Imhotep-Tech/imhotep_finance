import os
import datetime
import requests
from flask import session
from extensions import db
from sqlalchemy import text
from flask_sqlalchemy import SQLAlchemy

# set the currency every day to update the rates and save it on the session for better performance
def set_currency_session(favorite_currency):
    """Fetch and store exchange rates in session for better performance."""
    primary_api_key = os.getenv('EXCHANGE_API_KEY_PRIMARY') #get primary api key from environment

    data = None #initialize data variable
    try:
        response = requests.get(f"https://imhotepexchangeratesapi.pythonanywhere.com/latest_rates/{primary_api_key}/{favorite_currency}") #fetch exchange rates from api
        data = response.json() #convert response to json
        rate = data["data"] #extract rate data

    except requests.RequestException as e:
        print(f"Failed to fetch exchange rates: {e}") #print error message
        return None #return none on api failure

    if rate: #check if rate data is available
        #if the rate is imported correctly from the api then save it to the session of the user
        session["rate"] = rate #store exchange rates in session
        today = datetime.datetime.now().date() #get current date
        session["rate_date"] = today #store rate fetch date in session
        session["favorite_currency"] = favorite_currency #store favorite currency in session
        return rate #return exchange rates
    return None #return none if no rate data

#convert the currency to the fav currency of the user
def convert_to_fav_currency(dictionary, user_id):
        """Convert amounts in different currencies to user's favorite currency."""
        favorite_currency = select_favorite_currency(user_id) #get user's favorite currency
        today = datetime.datetime.now().date() #get current date
        if session.get('rate_date') != today: #check if rates are from today

            session.pop('rate', None) #remove old rate from session
            session.pop('rate_expire', None) #remove old rate expiration from session
            session.pop('favorite_currency', None) #remove old favorite currency from session

            rate = set_currency_session(favorite_currency) #fetch new exchange rates
            if not rate: #check if rate fetching failed
                return None, favorite_currency #return none if api failed
        elif session.get('favorite_currency') != favorite_currency: #check if favorite currency changed
            session.pop('rate', None) #remove old rate from session
            session.pop('rate_expire', None) #remove old rate expiration from session
            session.pop('favorite_currency', None) #remove old favorite currency from session

            rate = set_currency_session(favorite_currency) #fetch new exchange rates
            if not rate: #check if rate fetching failed
                return None, favorite_currency #return none if api failed
        else:
            rate = session.get('rate') #get exchange rates from session
            if rate == None: #check if no rates in session
                try:
                    rate = set_currency_session(favorite_currency) #fetch exchange rates
                except:
                    return "Error" #return error if api call fails

        total_favorite_currency = 0 #initialize total in favorite currency

        for currency, amount in dictionary.items(): #iterate through currency amounts
            converted_amount = amount / rate[currency] #convert amount to favorite currency
            total_favorite_currency += converted_amount #add to total

        return total_favorite_currency, favorite_currency #return converted total and favorite currency

#a function to show the networth of the user
def show_networth():
    """Calculate and return user's total networth in their favorite currency."""
    user_id = session.get("user_id") #get user id from session
    favorite_currency = select_favorite_currency(user_id) #get user's favorite currency

    #get all user's currency totals from database
    total_db = db.session.execute(
        text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchall()

    total_db_dict = dict(total_db) #convert to dictionary for easier processing

    total_favorite_currency,favorite_currency = convert_to_fav_currency(total_db_dict, user_id) #convert all amounts to favorite currency

    return total_favorite_currency, favorite_currency #return total networth and favorite currency

def select_currencies(user_id):
    """Get all currencies that the user has transactions in."""
    #get all currencies user has networth in
    currency_db = db.session.execute(
        text("SELECT currency from networth WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchall()

    currency_all = [] #initialize currency list
    for item in currency_db: #iterate through currency results
        currency_all.append(item[0]) #add currency to list

    return(currency_all) #return list of user currencies

#select the fav currency of a user
def select_favorite_currency(user_id):
        """Get user's favorite currency from database."""
        favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id" :user_id}
        ).fetchone()[0] #get favorite currency from database
        return favorite_currency #return user's favorite currency
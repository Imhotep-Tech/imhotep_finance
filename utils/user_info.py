from sqlalchemy import text
from extensions import db, cache
from flask import session, request
from datetime import date, datetime

def select_user_data(user_id):
        """Get user data (username, email, photo path) from database."""
        user_info = db.session.execute(
        text("SELECT user_username, user_mail, user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()[0] #get user info from database

        user_username = user_info[0] #extract username
        user_mail = user_info[1] #extract email
        user_photo_path = user_info[2] #extract photo path
        return user_username, user_mail, user_photo_path

@cache.cached(timeout=300, key_prefix="user_photo") #cache the photo for 300 seconds (5 mins)
def select_user_photo():
    """Get user photo path from database with caching."""
    user_id = session.get("user_id") #get user id from session
    user_photo_path = db.session.execute(
        text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchone()[0] #get photo path from database
    return user_photo_path

def trans(user_id):
    """Get paginated transactions for a user within a date range."""
    from_date = request.args.get("from_date") #get start date from url parameters
    to_date = request.args.get("to_date") #get end date from url parameters
    page = int(request.args.get("page", 1))  # Default to page 1 #get page number with default
    per_page = 20  # Number of records per page #set records per page

    offset = (page - 1) * per_page #calculate offset for pagination

    now = datetime.now() #get current datetime

    first_day_current_month = now.replace(day=1) #get first day of current month

    if now.month == 12: #check if december
        first_day_next_month = now.replace(year=now.year + 1, month=1, day=1) #set to january next year
    else:
        first_day_next_month = now.replace(month=now.month + 1, day=1) #set to first day next month

    if from_date is None: #check if no start date provided
        from_date = first_day_current_month.date() #use current month start

    if to_date is None: #check if no end date provided
        to_date = first_day_next_month.date() #use next month start

    #get transactions within date range with pagination
    trans_db = db.session.execute(
        text("SELECT * FROM trans WHERE user_id = :user_id AND date BETWEEN :from_date AND :to_date ORDER BY date DESC LIMIT :limit OFFSET :offset"),
        {"user_id": user_id, "from_date" :from_date, "to_date" :to_date, "limit": per_page, "offset": offset}
    ).fetchall()

    # Get total count for pagination
    total_count = db.session.execute(
        text('''
            SELECT COUNT(*) FROM trans
            WHERE user_id = :user_id
            AND date BETWEEN :from_date AND :to_date
        '''),
        {"user_id": user_id, "from_date": from_date, "to_date": to_date}
    ).scalar() #get total count of transactions

    total_pages = (total_count + per_page - 1) // per_page  # Calculate total number of pages #calculate total pages

    return trans_db, to_date,from_date, total_pages, page

def wishlist_page(user_id):
        """Get wishlist items for a user for the current year."""
        today = date.today() #get current date
        year = today.year #extract current year

        #get wishlist items for current year
        wishlist_db = db.session.execute(
            text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
            {"user_id" :user_id , "year" :year}
        ).fetchall()

        return year, wishlist_db

def select_years_wishlist(user_id):
        """Get all years that have wishlist entries for a user."""
        #get all distinct years from user's wishlist
        all_years_db = db.session.execute(
            text("SELECT DISTINCT(year) FROM wishlist WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchall()

        all_years = [] #initialize empty list
        for item in all_years_db: #iterate through years
            all_years.append(item[0]) #add year to list

        return all_years

@cache.cached(timeout=900, key_prefix="app_currencies")
def get_app_currencies():
    """Get list of supported currencies with caching."""
    currencies = [
        "USD", "EGP", "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", 
        "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", 
        "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", 
        "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", 
        "DZD", "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP", 
        "GHS", "GIP", "GMD", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", 
        "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD", 
        "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT", 
        "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", 
        "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", 
        "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", 
        "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", 
        "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", 
        "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", 
        "TTD", "TVD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VES", "VND", 
        "VUV", "WST", "XAF", "XCD", "XDR", "XOF", "XPF", "YER", "ZAR", "ZMW", 
        "ZWL"
    ] #list of supported currencies
    return currencies

def get_user_categories(trans_status, user_id):
    """Get user's most frequently used categories."""
    if not user_id or not trans_status: #validate input parameters
        return [] #return empty list if invalid

    if trans_status == "ANY": #check if getting all categories
         #get categories for all transaction types
         user_categories = db.session.execute(
            text("""
                SELECT category, COUNT(*) as frequency_of_category
                FROM trans 
                WHERE user_id = :user_id 
                AND category IS NOT NULL 
                AND category != ''
                GROUP BY category 
                ORDER BY frequency_of_category DESC 
                LIMIT 15
            """),
            {"user_id": user_id}
        ).fetchall()
         
    else: #get categories for specific transaction type
        user_categories = db.session.execute(
            text("""
                SELECT category, COUNT(*) as frequency_of_category
                FROM trans 
                WHERE user_id = :user_id 
                AND trans_status = :trans_status 
                AND category IS NOT NULL 
                AND category != ''
                GROUP BY category 
                ORDER BY frequency_of_category DESC 
                LIMIT 15
            """),
            {"user_id": user_id, "trans_status": trans_status}
        ).fetchall()

    # Extract just the category names from the result
    categories = [row[0] for row in user_categories] if user_categories else [] #extract category names
    return categories

@cache.cached(timeout=150, key_prefix="user_report")
def calculate_user_report(start_date, end_date, user_id):
    """Calculate user spending report with category breakdowns and percentages."""
    if not user_id: #validate user id
        return [], [], [], [] #return empty lists if invalid
    
    try:
        #get withdrawal transactions grouped by category
        user_withdraw_on_range = db.session.execute(
            text("""
                SELECT category, SUM(CAST(amount AS DECIMAL)) as total_amount, COUNT(*) as frequency_of_category
                FROM trans 
                WHERE user_id = :user_id 
                AND trans_status = :trans_status 
                AND category IS NOT NULL 
                AND category != ''
                AND date BETWEEN :start_date AND :end_date
                GROUP BY category 
                ORDER BY total_amount DESC 
                LIMIT 15
            """),
            {"user_id": user_id, "trans_status": "withdraw", "start_date":start_date, "end_date":end_date}
        ).fetchall()

        #get deposit transactions grouped by category
        user_deposit_on_range = db.session.execute(
            text("""
                SELECT category, SUM(CAST(amount AS DECIMAL)) as total_amount, COUNT(*) as frequency_of_category
                FROM trans 
                WHERE user_id = :user_id 
                AND trans_status = :trans_status 
                AND category IS NOT NULL 
                AND category != ''
                AND date BETWEEN :start_date AND :end_date
                GROUP BY category 
                ORDER BY total_amount DESC 
                LIMIT 15
            """),
            {"user_id": user_id, "trans_status": "deposit", "start_date":start_date, "end_date":end_date}
        ).fetchall()

        # Ensure we return empty lists if no data
        if user_withdraw_on_range is None: #check if no withdrawal data
            user_withdraw_on_range = [] #set to empty list
        if user_deposit_on_range is None: #check if no deposit data
            user_deposit_on_range = [] #set to empty list

        # Calculate percentages for withdrawals
        withdraw_percentages = [] #initialize withdrawal percentages list
        if user_withdraw_on_range: #check if withdrawal data exists
            total_withdraw = 0 #initialize total withdrawal amount
            for row in user_withdraw_on_range: #iterate through withdrawal data
                total_withdraw+=float(row[1]) #add amount to total

            if total_withdraw > 0: #check if total is greater than zero
                withdraw_percentages = [round((float(row[1]) / total_withdraw) * 100, 1) for row in user_withdraw_on_range] #calculate percentages
            else:
                withdraw_percentages = [0] * len(user_withdraw_on_range) #set all percentages to zero

        # Calculate percentages for deposits
        deposit_percentages = [] #initialize deposit percentages list
        if user_deposit_on_range: #check if deposit data exists
            
            total_deposit = 0 #initialize total deposit amount
            for row in user_deposit_on_range: #iterate through deposit data
                total_deposit+=float(row[1]) #add amount to total

            if total_deposit > 0: #check if total is greater than zero
                deposit_percentages = [round((float(row[1]) / total_deposit) * 100, 1) for row in user_deposit_on_range] #calculate percentages
            else:
                deposit_percentages = [0] * len(user_deposit_on_range) #set all percentages to zero

        return user_withdraw_on_range, user_deposit_on_range, withdraw_percentages, deposit_percentages
    
    except Exception as e:
        print(f"Error in calculate_user_report: {e}") #print error message
        return [], [], [], [] #return empty lists on error

def select_scheduled_trans(user_id, page):
    """Get paginated scheduled transactions for a user."""
    per_page = 20 #set records per page

    offset = (page - 1) * per_page #calculate offset for pagination

    #get scheduled transactions with pagination
    trans_db = db.session.execute(
        text("SELECT * FROM scheduled_trans WHERE user_id = :user_id ORDER BY date DESC LIMIT :limit OFFSET :offset"),
        {"user_id": user_id, "limit": per_page, "offset": offset}
    ).fetchall()

    # Get total count for pagination
    total_count = db.session.execute(
        text('''
            SELECT COUNT(*) FROM scheduled_trans
            WHERE user_id = :user_id
        '''),
        {"user_id": user_id}
    ).scalar() #get total count of scheduled transactions

    total_pages = (total_count + per_page - 1) // per_page  # Calculate total number of pages #calculate total pages

    return trans_db, total_pages, page

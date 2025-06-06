from sqlalchemy import text
from extensions import db
from flask import session, request
from datetime import date, datetime

def select_user_data(user_id):
        user_info = db.session.execute(
        text("SELECT user_username, user_mail, user_photo_path FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchall()[0]

        user_username = user_info[0]
        user_mail = user_info[1]
        user_photo_path = user_info[2]
        return user_username, user_mail, user_photo_path

def select_user_photo():
    user_id = session.get("user_id")
    user_photo_path = db.session.execute(
        text("SELECT user_photo_path FROM users WHERE user_id = :user_id"),
        {"user_id": user_id}
    ).fetchone()[0]
    return user_photo_path

def trans(user_id):
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")
    page = int(request.args.get("page", 1))  # Default to page 1
    per_page = 20  # Number of records per page

    offset = (page - 1) * per_page

    now = datetime.now()

    first_day_current_month = now.replace(day=1)

    if now.month == 12:
        first_day_next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        first_day_next_month = now.replace(month=now.month + 1, day=1)

    if from_date is None:
        from_date = first_day_current_month.date()

    if to_date is None:
        to_date = first_day_next_month.date()

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
    ).scalar()

    total_pages = (total_count + per_page - 1) // per_page  # Calculate total number of pages

    return trans_db, to_date,from_date, total_pages, page

def wishlist_page(user_id):
        today = date.today()
        year = today.year

        wishlist_db = db.session.execute(
            text("SELECT * FROM wishlist WHERE user_id = :user_id AND year = :year ORDER BY wish_id"),
            {"user_id" :user_id , "year" :year}
        ).fetchall()

        return year, wishlist_db

def select_years_wishlist(user_id):
        all_years_db = db.session.execute(
            text("SELECT DISTINCT(year) FROM wishlist WHERE user_id = :user_id"),
            {"user_id" :user_id}
        ).fetchall()

        all_years = []
        for item in all_years_db:
            all_years.append(item[0])

        return all_years

def get_app_currencies():
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
    ]
    return currencies
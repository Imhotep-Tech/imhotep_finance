'''def query_gemini(prompt, user_data):
    enriched_prompt = prompt
    if user_data:
        enriched_prompt = f"User data: {user_data}\n{prompt}"

    response = chat_session.send_message(enriched_prompt)
    print(response.text)
    return response.text

def get_user_data(user_id):
    trans_db = db.session.execute(
        text("SELECT currency, date, amount, trans_status, trans_details FROM trans WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    target_db = db.session.execute(
        text("SELECT target, mounth, year FROM target WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    wishlist_db = db.session.execute(
        text("SELECT currency, price, status, link, wish_details, year FROM wishlist WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    networth_db = db.session.execute(
        text("SELECT currency, total FROM networth WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchall()
    print(user_id)
    favorite_currency = db.session.execute(
        text("SELECT favorite_currency FROM users WHERE user_id = :user_id"),
        {"user_id":user_id}
    ).fetchone()[0]
    print(favorite_currency)
    user_data = {
        'transactions': [{'currency': row[0], 'date': row[1].strftime('%Y-%m-%d'), 'amount': float(row[2]), 'trans_status': row[3], 'trans_details': row[4] } for row in trans_db],
        'user_save_target': [{'target': row[0], 'mounth': row[1], 'year': row[2]} for row in target_db],
        'wishlist': [{'currency': row[0], 'price': row[1], 'status': row[2], 'link': row[3], 'wish_details': row[4], 'year': row[5]} for row in wishlist_db],
        'networth': [{'currency': row[0], 'total': row[1]} for row in networth_db],
        'favorite_currency': favorite_currency,
        }
    return user_data'''
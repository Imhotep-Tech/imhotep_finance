def serialize_transaction(trans):

    return {
        "id": trans.id,
        "user_id": trans.user.id if trans.user else None,
        "date": trans.date.isoformat() if trans.date else None,
        "amount": trans.amount,
        "currency": trans.currency,
        "trans_status": trans.trans_status,
        "trans_details": trans.trans_details,
        "category": trans.category,
        "created_at": trans.created_at.isoformat() if trans.created_at else None,
    }

def serialize_wishlist(wish):

    return {
        "id": wish.id,
        "user_id": wish.user_id,
        "transaction_id": getattr(wish.transaction, "id", None) if hasattr(wish, "transaction") and wish.transaction else None,
        "year": wish.year,
        "price": wish.price,
        "currency": wish.currency,
        "status": wish.status,
        "link": wish.link,
        "wish_details": wish.wish_details,
        "created_at": wish.created_at.isoformat() if wish.created_at else None,
    }
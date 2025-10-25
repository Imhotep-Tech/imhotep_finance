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
        "transaction_id": wish.transaction.id if wish.transaction else None,
        "transaction_date":  wish.transaction.date.isoformat() if wish.transaction and wish.transaction.date else None,
        "year": wish.year,
        "price": wish.price,
        "currency": wish.currency,
        "status": wish.status,
        "link": wish.link,
        "wish_details": wish.wish_details,
        "created_at": wish.created_at.isoformat() if wish.created_at else None,
    }

def serialize_scheduled_trans(scheduled_trans):

    return {
        "id": scheduled_trans.id,
        "user_id": scheduled_trans.user.id if scheduled_trans.user else None,
        "day_of_month": scheduled_trans.date,
        "amount": scheduled_trans.amount,
        "currency": scheduled_trans.currency,
        "scheduled_trans_status": scheduled_trans.scheduled_trans_status,
        "scheduled_trans_details": scheduled_trans.scheduled_trans_details,
        "category": scheduled_trans.category,
        "status": scheduled_trans.status,
        "created_at": scheduled_trans.created_at.isoformat() if scheduled_trans.created_at else None,
    }


def serialize_target(target_obj):

    return {
        "id": target_obj.id,
        "user_id": target_obj.user.id if target_obj.user else None,
        "target": target_obj.target,
        "month": target_obj.month,
        "year": target_obj.year,
        "score": target_obj.score,
        "created_at": target_obj.created_at.isoformat() if target_obj.created_at else None,
    }
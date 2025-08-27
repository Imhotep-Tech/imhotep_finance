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
from django.utils import timezone
from requests import Response
from ...utils.currencies import get_allowed_currencies
from ...models import Transactions, NetWorth

def create_transaction(user, date, amount, currency, trans_details, category, trans_status):
    """Create a transaction and update networth."""

    if not user:
        return False, {"message": "User must be authenticated!", "status": 401}
    
    if currency is None or amount is None:
        return False, {"message": "You have to choose the currency and amount!", "status": 400}

    amount = float(amount)

    # If date is not provided, use current date
    if not date:
        date = timezone.now().date()

    if currency not in get_allowed_currencies():
        return False, {"message": "Currency code not supported", "status": 400}

    available_status = [
        "Deposit",
        "Withdraw",
        "deposit",
        "withdraw"
    ]

    if trans_status not in available_status:
        return False, {"message": "Transaction status must be either Deposit or Withdraw", "status": 400}

    if amount <= 0:
        return False, {"message": "Amount must be greater than zero", "status": 400}

    old_netWorth = NetWorth.objects.filter(user=user, currency=currency)

    if trans_status.lower() == "withdraw":
        total = float(old_netWorth.first().total) if old_netWorth.exists() else 0
        if (total - amount) < 0:
            return False, {"message": "You don't have enough of this currency", "status": 400}

    try:
        user_transaction = Transactions.objects.create(
            user=user,
            date=date,
            amount=amount,
            currency=currency,
            trans_status=trans_status,
            category=category,
            trans_details=trans_details
        )
        user_transaction.save()
    except Exception:
        return False, {"message": "Error happened while creating the transaction", "status": 500}

    if old_netWorth.exists():
        total = float(old_netWorth.first().total)
        if trans_status.lower() == "deposit":
            new_total_calc = total + amount
        else:
            new_total_calc = total - amount
        old_netWorth.update(total=new_total_calc)
    else:
        new_netWorth = NetWorth.objects.create(
            user=user,
            total=amount,
            currency=currency
        )
        new_netWorth.save()

    return user_transaction, None
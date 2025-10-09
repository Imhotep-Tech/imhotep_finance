from django.utils import timezone
from requests import Response
from ...utils.currencies import get_allowed_currencies
from ...models import Transactions, NetWorth
from ...user_reports.utils.save_user_report import save_user_report_with_transaction
from datetime import datetime, date

def create_transaction(request, user, date_param, amount, currency, trans_details, category, trans_status):
    """Create a transaction and update networth."""

    if not user:
        return False, {"message": "User must be authenticated!", "status": 401}
    
    if currency is None or amount is None:
        return False, {"message": "You have to choose the currency and amount!", "status": 400}

    amount = float(amount)

    # Handle date parameter - convert string to date object if needed
    if not date_param:
        transaction_date = timezone.now().date()
    elif isinstance(date_param, str):
        try:
            # Try to parse string date in YYYY-MM-DD format
            transaction_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            try:
                # Try other common formats
                transaction_date = datetime.strptime(date_param, '%Y-%m-%d %H:%M:%S').date()
            except ValueError:
                return False, {"message": "Invalid date format. Use YYYY-MM-DD format.", "status": 400}
    elif isinstance(date_param, datetime):
        transaction_date = date_param.date()
    elif isinstance(date_param, date):
        transaction_date = date_param
    else:
        return False, {"message": "Invalid date format.", "status": 400}

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
            date=transaction_date,
            amount=amount,
            currency=currency,
            trans_status=trans_status,
            category=category,
            trans_details=trans_details
        )
        user_transaction.save()
    except Exception as e:
        print(f"Database error in create_transaction: {str(e)}")  # Log detailed error for debugging
        return False, {"message": "Error occurred while creating the transaction", "status": 500}

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
            total=amount if trans_status.lower() == "deposit" else 0,
            currency=currency
        )
        new_netWorth.save()
    
    # Update or create monthly report after transaction creation
    try:
        save_user_report_with_transaction(request, user, transaction_date, user_transaction)
    except Exception as e:
        print(f"Report update error in create_transaction: {str(e)}")  # Log detailed error for debugging
                     
    return user_transaction, None
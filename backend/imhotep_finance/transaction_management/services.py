from django.utils import timezone
from django.core.exceptions import ValidationError
from finance_management.utils.currencies import get_allowed_currencies
from transaction_management.models import Transactions, NetWorth
from user_reports.user_reports.utils.save_user_report import save_user_report_with_transaction
from datetime import date
from django.db import transaction

def create_transaction(*,user, amount, currency, trans_details, category, trans_status, transaction_date: date=None, request=None):
    """Create a transaction and update networth."""

    #Just in case more security for inner calls
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if currency is None or amount is None:
        raise ValidationError("You have to choose the currency and amount!")

    if amount <= 0:
        raise ValidationError("Amount must be greater than zero")

    amount = float(amount)

    #if date not provided, use today
    if transaction_date is None:
        transaction_date = date.today()

    #Validate currency for inner calls
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")

    if trans_status.lower() == "withdraw":
        net_worth = NetWorth.objects.filter(user=user, currency=currency).first()
        current_balance = net_worth.total if net_worth else 0.00

        if current_balance < amount:
            raise ValidationError(f"Insufficient funds. You only have {current_balance} {currency}.")

    with transaction.atomic():
        #create Transaction
        user_transaction = Transactions.objects.create(
            user=user,
            date=transaction_date,
            amount=amount,
            currency=currency,
            trans_status=trans_status,
            category=category,
            trans_details=trans_details
        )

        #Update NetWorth
        net_worth_obj, created = NetWorth.objects.get_or_create(
                user=user, 
                currency=currency,
                defaults={'total': 0}
            )
        if trans_status.lower() == "deposit":
            net_worth_obj.total += amount
        else:
            net_worth_obj.total -= amount
        
        net_worth_obj.save()
    
    #TODO: The request param is only for saving user reports, find a better way
    if request:
            save_user_report_with_transaction(request, user, transaction_date, user_transaction)
                     
    return user_transaction
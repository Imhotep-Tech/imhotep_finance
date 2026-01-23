from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError
from finance_management.utils.currencies import get_allowed_currencies
from transaction_management.models import Transactions, NetWorth
from user_reports.user_reports.utils.save_user_report import save_user_report_with_transaction, save_user_report_with_transaction_update
from datetime import date
from django.db import transaction
from wishlist_management.models import Wishlist

def create_transaction(*,user, amount, currency, trans_details, category, trans_status, transaction_date: date=None):
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
    
        save_user_report_with_transaction(user, transaction_date, user_transaction)
                     
    return user_transaction

def delete_transaction(*, user, transaction_id):
    """Delete a transaction and update networth and related entities."""

    # Get the transaction
    trans_obj = get_object_or_404(Transactions, id=transaction_id, user=user)
    
    old_amount = trans_obj.amount
    old_currency = trans_obj.currency
    old_trans_status = trans_obj.trans_status
    transaction_date = trans_obj.date

    # Get current networth
    net_worth_obj = get_object_or_404(NetWorth, user=user, currency=old_currency)
    old_total = float(net_worth_obj.total)

    # Calculate new total
    if old_trans_status.lower() == "deposit":
        new_total = old_total - float(old_amount)
        if new_total < 0:
            raise ValidationError("You can't delete this transaction as it would result in negative balance")
    elif old_trans_status.lower() == "withdraw":
        new_total = old_total + float(old_amount)
    else:
        raise ValidationError("Invalid transaction status")

    with transaction.atomic():
        # Update wishlist if exists
        wish = Wishlist.objects.filter(transaction=trans_obj, user=user).first()
        if wish:
            wish.status = False
            wish.save()
        
        # Update the report before deleting
        save_user_report_with_transaction(
            user, transaction_date, trans_obj, parent_function="delete_transaction"
        )
        
        
        # Delete the transaction
        trans_obj.delete()
        
        # Update networth
        net_worth_obj.total = new_total
        net_worth_obj.save()
    
    return new_total

def update_transaction(*, user, transaction_id, amount, currency, trans_details, category, trans_status, transaction_date: date):
    """Update a transaction and recalculate networth."""
    
    if currency is None or amount is None:
        raise ValidationError("You have to choose the currency and amount!")

    if amount <= 0:
        raise ValidationError("Amount must be greater than zero")

    amount = float(amount)

    # Validate currency
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")

    # Get the transaction
    trans_obj = get_object_or_404(Transactions, id=transaction_id, user=user)
    
    # Create a snapshot of old transaction data
    class OldTransactionSnapshot:
        def __init__(self, original_transaction):
            self.date = original_transaction.date
            self.amount = float(original_transaction.amount)
            self.currency = original_transaction.currency
            self.trans_status = original_transaction.trans_status
            self.category = original_transaction.category
            self.trans_details = original_transaction.trans_details
            self.user = original_transaction.user
            self.id = original_transaction.id

    old_transaction = OldTransactionSnapshot(trans_obj)
    
    old_amount = float(trans_obj.amount)
    old_status = trans_obj.trans_status
    old_currency = trans_obj.currency

    # Get networth for the currency
    net_worth_obj = get_object_or_404(NetWorth, user=user, currency=currency)
    current_total = float(net_worth_obj.total)

    # Reverse old transaction effect
    if old_status.lower() == "withdraw":
        current_total += old_amount
    elif old_status.lower() == "deposit":
        current_total -= old_amount

    # Apply new transaction effect
    if trans_status.lower() == "withdraw":
        new_total = current_total - amount
    elif trans_status.lower() == "deposit":
        new_total = current_total + amount
    else:
        raise ValidationError("Transaction status must be either Deposit or Withdraw")

    if new_total < 0:
        raise ValidationError("Insufficient balance for this withdrawal")

    with transaction.atomic():
        # Update transaction
        trans_obj.date = transaction_date
        trans_obj.trans_details = trans_details
        trans_obj.amount = amount
        trans_obj.category = category
        trans_obj.currency = currency
        trans_obj.trans_status = trans_status
        trans_obj.save()

        # Update networth
        net_worth_obj.total = new_total
        net_worth_obj.save()

        # Update reports
        save_user_report_with_transaction_update(
            user, old_transaction, trans_obj
        )
    
    return trans_obj
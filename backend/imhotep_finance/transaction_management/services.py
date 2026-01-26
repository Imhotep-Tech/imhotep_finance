from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError
from finance_management.utils.currencies import get_allowed_currencies
from transaction_management.models import Transactions, NetWorth
from user_reports.utils.save_user_report import save_user_report_with_transaction, save_user_report_with_transaction_update
from datetime import date, datetime
from typing import List, Dict, Tuple
from django.db import transaction
from wishlist_management.models import Wishlist
import csv
from io import TextIOWrapper

def create_transaction(*,user, amount, currency, trans_details, category, trans_status, transaction_date):
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

    if not isinstance(transaction_date, date):
        try:
            transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValidationError("Invalid date format. Use YYYY-MM-DD")

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

    # Get or create networth for the currency
    net_worth_obj, created = NetWorth.objects.get_or_create(
        user=user,
        currency=currency,
        defaults={'total': 0}
    )
    current_total = float(net_worth_obj.total)

    # If currency changed, need to handle old currency networth
    if old_currency != currency:
        old_net_worth = NetWorth.objects.filter(user=user, currency=old_currency).first()
        if old_net_worth:
            # Reverse old transaction from old currency
            if old_status.lower() == "withdraw":
                old_net_worth.total += old_amount
            elif old_status.lower() == "deposit":
                old_net_worth.total -= old_amount
            old_net_worth.save()
    else:
        # Same currency - reverse old transaction effect
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

def parse_csv_transactions(file) -> Tuple[List[Dict], List[str]]:
    """Parse CSV file and return transaction data and validation errors."""
    transactions_data = []
    errors = []
    MAX_ROWS = 1000
    
    try:
        # Reset file pointer
        file.seek(0)
        
        # Read file content and decode
        file_content = file.read()
        decoded_content = file_content.decode('utf-8')
        
        # Create StringIO from decoded content
        from io import StringIO
        file_wrapper = StringIO(decoded_content)
        csv_reader = csv.DictReader(file_wrapper)
        
        row_count = 0
        for row_num, row in enumerate(csv_reader, start=2):
            row_count += 1
            
            # Check row limit
            if row_count > MAX_ROWS:
                errors.append(f"Row limit exceeded. Only the first {MAX_ROWS} rows were processed.")
                break
            
            # Normalize row keys
            normalized_row = {k.strip().lower(): v.strip() if v else '' for k, v in row.items() if k}
            
            # Extract and validate required fields
            date_val = normalized_row.get('date', '')
            amount_str = normalized_row.get('amount', '')
            currency_val = normalized_row.get('currency', '')
            trans_status_val = normalized_row.get('trans_status', '')
            
            # Validate required fields
            if not date_val:
                errors.append(f"Row {row_num}: Missing required field 'date'.")
                continue
            
            if not amount_str:
                errors.append(f"Row {row_num}: Missing required field 'amount'.")
                continue
            
            if not currency_val:
                errors.append(f"Row {row_num}: Missing required field 'currency'.")
                continue
            
            if not trans_status_val:
                errors.append(f"Row {row_num}: Missing required field 'trans_status'.")
                continue
            
            # Validate amount
            try:
                amount = float(amount_str)
                if amount <= 0:
                    errors.append(f"Row {row_num}: Amount must be a positive number.")
                    continue
            except ValueError:
                errors.append(f"Row {row_num}: Invalid amount '{amount_str}'. Must be a number.")
                continue
            
            # Validate trans_status
            trans_status_lower = trans_status_val.lower()
            if trans_status_lower not in ['deposit', 'withdraw']:
                errors.append(f"Row {row_num}: Invalid trans_status '{trans_status_val}'. Must be 'deposit' or 'withdraw'.")
                continue
            
            # Add to transactions data
            transactions_data.append({
                'date': date_val,
                'amount': amount,
                'currency': currency_val,
                'trans_status': trans_status_lower,
                'trans_details': normalized_row.get('trans_details', ''),
                'category': normalized_row.get('category', ''),
            })
    
    except Exception as e:
        errors.append(f"Error reading CSV file: {str(e)}")
    
    return transactions_data, errors


def bulk_import_transactions(*, user, transactions_data: List[Dict]) -> Tuple[int, List[str]]:
    """
    Bulk import transactions from a list of transaction data.
    Returns (created_count, errors_list)
    """
    created_count = 0
    errors = []
    
    for row_num, transaction_data in enumerate(transactions_data, start=2):
        try:
            # Extract values
            date_val = transaction_data.get('date', '')
            amount_val = transaction_data.get('amount')
            currency_val = transaction_data.get('currency', '')
            trans_status_val = transaction_data.get('trans_status', '')
            trans_details = transaction_data.get('trans_details', '')
            category = transaction_data.get('category', '')
            
            # Parse date
            try:
                if isinstance(date_val, str):
                    transaction_date = datetime.strptime(date_val, '%Y-%m-%d').date()
                elif isinstance(date_val, date):
                    transaction_date = date_val
                else:
                    errors.append(f"Row {row_num}: Invalid date format")
                    continue
            except ValueError:
                errors.append(f"Row {row_num}: Invalid date format. Use YYYY-MM-DD")
                continue
            
            # Create transaction using existing service
            create_transaction(
                user=user,
                amount=amount_val,
                currency=currency_val,
                trans_status=trans_status_val.lower(),
                category=category,
                trans_details=trans_details,
                transaction_date=transaction_date
            )
            
            created_count += 1
            
        except ValidationError as e:
            errors.append(f"Row {row_num}: {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: Error processing row - {str(e)}")
    
    return created_count, errors
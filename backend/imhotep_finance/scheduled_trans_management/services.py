from django.core.exceptions import ValidationError
from scheduled_trans_management.models import ScheduledTransaction
from finance_management.utils.currencies import get_allowed_currencies
from django.db import transaction
import calendar
from datetime import date


def create_scheduled_transaction(*, user, day_of_month, amount, currency, scheduled_trans_status, category, scheduled_trans_details):
    """Create a scheduled transaction."""
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if currency is None or amount is None:
        raise ValidationError("You have to choose the currency and amount!")
    
    if amount <= 0:
        raise ValidationError("Amount must be greater than zero")
    
    amount = float(amount)
    
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")
    
    if scheduled_trans_status.lower() not in ['deposit', 'withdraw']:
        raise ValidationError("Transaction Status Must Be Deposit Or Withdraw")
    
    if not day_of_month or day_of_month < 1 or day_of_month > 31:
        raise ValidationError("Day of month must be between 1 and 31")
    
    with transaction.atomic():
        scheduled_trans = ScheduledTransaction.objects.create(
            user=user,
            date=day_of_month,
            amount=amount,
            currency=currency,
            scheduled_trans_status=scheduled_trans_status,
            category=category,
            scheduled_trans_details=scheduled_trans_details,
            status=True  # Active by default
        )
    
    return scheduled_trans


def delete_scheduled_transaction(*, user, scheduled_trans_id):
    """Delete a scheduled transaction."""
    from django.shortcuts import get_object_or_404
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    scheduled_trans = get_object_or_404(ScheduledTransaction, id=scheduled_trans_id, user=user)
    
    with transaction.atomic():
        scheduled_trans.delete()
    
    return True


def update_scheduled_transaction(*, user, scheduled_trans_id, day_of_month, amount, currency, scheduled_trans_status, category, scheduled_trans_details):
    """Update a scheduled transaction."""
    from django.shortcuts import get_object_or_404
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if currency is None or amount is None:
        raise ValidationError("You have to choose the currency and amount!")
    
    if amount <= 0:
        raise ValidationError("Amount must be greater than zero")
    
    amount = float(amount)
    
    if currency not in get_allowed_currencies():
        raise ValidationError("Currency code not supported")
    
    if scheduled_trans_status.lower() not in ['deposit', 'withdraw']:
        raise ValidationError("Transaction Status Must Be Deposit Or Withdraw")
    
    if not day_of_month or day_of_month < 1 or day_of_month > 31:
        raise ValidationError("Day of month must be between 1 and 31")
    
    scheduled_trans = get_object_or_404(ScheduledTransaction, id=scheduled_trans_id, user=user)
    
    with transaction.atomic():
        scheduled_trans.date = day_of_month
        scheduled_trans.amount = amount
        scheduled_trans.currency = currency
        scheduled_trans.scheduled_trans_status = scheduled_trans_status
        scheduled_trans.category = category
        scheduled_trans.scheduled_trans_details = scheduled_trans_details
        scheduled_trans.save()
    
    return scheduled_trans


def toggle_scheduled_transaction_status(*, user, scheduled_trans_id):
    """Toggle the active status of a scheduled transaction."""
    from django.shortcuts import get_object_or_404
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    scheduled_trans = get_object_or_404(ScheduledTransaction, id=scheduled_trans_id, user=user)
    
    with transaction.atomic():
        scheduled_trans.status = not scheduled_trans.status
        scheduled_trans.save()
    
    return scheduled_trans


def apply_scheduled_transactions(*, user):
    """
    Apply scheduled transactions (salary, bills, etc.) for all months since
    last_time_added up until today. Ensures catch-up if user didn't open
    the app for months.
    """
    from transaction_management.services import create_transaction
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    now = date.today()
    applied_count = 0
    errors_list = []
    
    scheduled = ScheduledTransaction.objects.filter(user=user, status=True)
    
    try:
        with transaction.atomic():
            for sched in scheduled:
                if sched.amount is None or sched.amount <= 0:
                    errors_list.append("Invalid amount")
                    continue
                
                if sched.scheduled_trans_status.lower() not in ["deposit", "withdraw"]:
                    errors_list.append(f"Invalid status '{sched.scheduled_trans_status}'")
                    continue
                
                # Determine the starting year/month
                if sched.last_time_added:
                    last = sched.last_time_added.date() if hasattr(sched.last_time_added, "date") else sched.last_time_added
                    year, month = last.year, last.month
                    # Move to next month after last_time_added
                    if month == 12:
                        year, month = year + 1, 1
                    else:
                        month += 1
                else:
                    year, month = now.year, now.month
                
                # Iterate months up to current month/year
                while (year, month) <= (now.year, now.month):
                    days_in_month = calendar.monthrange(year, month)[1]
                    actual_day = min(sched.date, days_in_month)
                    trans_date = date(year, month, actual_day)
                    
                    # Only apply if the scheduled day has passed (or is today)
                    if trans_date > now:
                        break
                    
                    try:
                        # Use create_transaction service
                        create_transaction(
                            user=user,
                            transaction_date=trans_date,
                            amount=sched.amount,
                            currency=sched.currency,
                            trans_details=sched.scheduled_trans_details,
                            category=sched.category,
                            trans_status=sched.scheduled_trans_status
                        )
                        
                        # Successfully created transaction
                        applied_count += 1
                        
                        # Update last_time_added to this applied date
                        sched.last_time_added = trans_date
                        sched.save(update_fields=["last_time_added"])
                        
                    except ValidationError as e:
                        error_msg = str(e)
                        if "insufficient" in error_msg.lower():
                            errors_list.append("Insufficient funds")
                        elif "networth" in error_msg.lower():
                            errors_list.append("No NetWorth")
                        else:
                            errors_list.append(error_msg)
                        break
                    
                    # Go to next month
                    if month == 12:
                        year, month = year + 1, 1
                    else:
                        month += 1
        
        return {
            "success": True,
            "applied_count": applied_count,
            "errors": errors_list,
        }
        
    except Exception as e:
        return {
            "success": False,
            "applied_count": 0,
            "errors": [f"Unexpected server error"],
        }

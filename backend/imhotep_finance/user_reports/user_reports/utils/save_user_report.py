from unicodedata import category
from ...models import Reports
from finance_management.utils.currencies import convert_to_fav_currency
import calendar
from datetime import datetime, date

def save_user_report(user, start_date, response_data):
    '''Saves or updates a user report for the given month and year
        This Function is called from an already prepared data "adding multiple data at a time"
    '''
    if not user or not start_date or not response_data:
        return False, "Invalid parameters"
    
    # Check if a report for the same month and year already exists
    try:
        user_report = Reports.objects.filter(user=user, month=start_date.month, year=start_date.year).first()
        if user_report:
            # Always update the data to ensure it's current
            user_report.data = response_data
            user_report.save()
            return True, None
    except Exception as e:
        return False, str(e)
    
    # Create and save a new report if it doesn't exist for this month and year
    try:
        user_report = Reports.objects.create(
            user=user,
            month=start_date.month,
            year=start_date.year,
            data=response_data
        )
        user_report.save()
        return True, None
    except Exception as e:
        return False, str(e)

def save_user_report_with_transaction(request, user, start_date, transaction, parent_function=None):
    '''This will be used for updating the report when a new transaction is created or deleted
        This function will be called when created only one new transaction
    '''
    if not user or not start_date or not transaction:
        return False, "Invalid parameters"
    
    if isinstance(start_date, str):
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return False, "Invalid date format"
    elif isinstance(start_date, datetime):
        start_date = start_date.date()
    elif not isinstance(start_date, date):
        return False, "Invalid date type"
    
    trans_status = transaction.trans_status.lower()
    amount = float(transaction.amount)
    category = transaction.category or "Uncategorized"
    currency = transaction.currency

    # Convert to favorite currency if needed
    try:
        if user.favorite_currency and user.favorite_currency != transaction.currency:
            amount_not_fav_currency = {currency: amount}
            converted_amount, _ = convert_to_fav_currency(request, amount_not_fav_currency)
            if converted_amount is not None:
                amount = converted_amount
    except Exception as e:
        print(f"Currency conversion error in save_user_report_with_transaction: {str(e)}")  # Log detailed error for debugging
        # Continue with original amount if conversion fails

    # Handle deletion case
    if parent_function == "delete_transaction":
        amount = -amount

    # Check if a report for the same month and year already exists
    user_report = Reports.objects.filter(user=user, month=start_date.month, year=start_date.year).first()
    
    if user_report:
        # Update existing report
        if trans_status == "deposit":
            user_report.data["total_deposit"] = user_report.data.get("total_deposit", 0) + amount
            
            # Update or add category breakdown
            found = False
            for item in user_report.data.get("user_deposit_on_range", []):
                if item["category"] == category:
                    item["converted_amount"] = item.get("converted_amount", 0) + amount
                    found = True
                    break
            
            if not found and amount > 0:  # Only add new category if amount is positive
                if "user_deposit_on_range" not in user_report.data:
                    user_report.data["user_deposit_on_range"] = []
                user_report.data["user_deposit_on_range"].append({
                    "category": category,
                    "converted_amount": amount,
                    "percentage": 0
                })
            
            # Remove categories with zero or negative amounts
            user_report.data["user_deposit_on_range"] = [
                item for item in user_report.data.get("user_deposit_on_range", [])
                if item.get("converted_amount", 0) > 0
            ]
            
            # Recalculate percentages
            total = user_report.data.get("total_deposit", 0)
            if total > 0:
                for item in user_report.data.get("user_deposit_on_range", []):
                    item["percentage"] = round((item.get("converted_amount", 0) / total) * 100, 1)
        
        elif trans_status == "withdraw":
            user_report.data["total_withdraw"] = user_report.data.get("total_withdraw", 0) + amount
            
            # Update or add category breakdown
            found = False
            for item in user_report.data.get("user_withdraw_on_range", []):
                if item["category"] == category:
                    item["converted_amount"] = item.get("converted_amount", 0) + amount
                    found = True
                    break
            
            if not found and amount > 0:  # Only add new category if amount is positive
                if "user_withdraw_on_range" not in user_report.data:
                    user_report.data["user_withdraw_on_range"] = []
                user_report.data["user_withdraw_on_range"].append({
                    "category": category,
                    "converted_amount": amount,
                    "percentage": 0
                })
            
            # Remove categories with zero or negative amounts
            user_report.data["user_withdraw_on_range"] = [
                item for item in user_report.data.get("user_withdraw_on_range", [])
                if item.get("converted_amount", 0) > 0
            ]
            
            # Recalculate percentages
            total = user_report.data.get("total_withdraw", 0)
            if total > 0:
                for item in user_report.data.get("user_withdraw_on_range", []):
                    item["percentage"] = round((item.get("converted_amount", 0) / total) * 100, 1)
        
        # Ensure totals don't go negative
        user_report.data["total_deposit"] = max(0, user_report.data.get("total_deposit", 0))
        user_report.data["total_withdraw"] = max(0, user_report.data.get("total_withdraw", 0))
        
        user_report.save()
        return True, None
    
    # Create new report if it doesn't exist and amount is positive
    elif amount > 0:
        month_name = calendar.month_name[start_date.month]
        report_data = {
            "current_month": f"{month_name} {start_date.year}",
            "total_withdraw": float(amount) if trans_status == "withdraw" else 0.0,
            "total_deposit": float(amount) if trans_status == "deposit" else 0.0,
            "user_withdraw_on_range": [
                {
                    "category": category,
                    "converted_amount": float(amount),
                    "percentage": 100.0
                }
            ] if trans_status == "withdraw" else [],
            "user_deposit_on_range": [
                {
                    "category": category,
                    "converted_amount": float(amount),
                    "percentage": 100.0
                }
            ] if trans_status == "deposit" else [],
            "favorite_currency": user.favorite_currency or 'USD'
        }
        
        try:
            user_report = Reports.objects.create(
                user=user,
                month=start_date.month,
                year=start_date.year,
                data=report_data
            )
            user_report.save()
            return True, None
        except Exception as e:
            return False, str(e)
    
    return True, None

def save_user_report_with_transaction_update(request, user, old_transaction, new_transaction):
    '''This will be used for updating the report when a transaction is edited 
        This function handles changes in date, category, amount, and currency
    '''
    if not user or not old_transaction or not new_transaction:
        return False, "Invalid parameters"
    
    old_date = old_transaction.date
    new_date = new_transaction.date
    
    # Ensure dates are date objects
    if isinstance(old_date, str):
        try:
            old_date = datetime.strptime(old_date, '%Y-%m-%d').date()
        except ValueError:
            return False, "Invalid old date format"
    elif isinstance(old_date, datetime):
        old_date = old_date.date()
    
    if isinstance(new_date, str):
        try:
            new_date = datetime.strptime(new_date, '%Y-%m-%d').date()
        except ValueError:
            return False, "Invalid new date format"
    elif isinstance(new_date, datetime):
        new_date = new_date.date()
    
    # Always remove the old transaction first
    success, error = save_user_report_with_transaction(
        request, user, old_date, old_transaction, parent_function="delete_transaction"
    )
    if not success:
        return False, f"Failed to remove old transaction: {error}"
    
    # Then add the new transaction
    success, error = save_user_report_with_transaction(
        request, user, new_date, new_transaction
    )
    if not success:
        return False, f"Failed to add new transaction: {error}"
    
    return True, None

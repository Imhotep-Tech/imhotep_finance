from django.db.models import Sum, Count, Case, When, Value, TextField  # Added TextField import
from ...models import Transactions
from ...utils.currencies import convert_to_fav_currency

def calculate_user_report(start_date, end_date, user, request):
    """Calculate user spending report with category breakdowns, percentages, and totals."""
    if not user:
        return [], [], [], [], 0.0, 0.0  # Return empty lists and zero totals if invalid
    
    try:
        # Get withdrawal transactions
        user_withdraw_on_range = list(
            Transactions.objects.filter(
                user=user,
                trans_status='withdraw',
                date__range=(start_date, end_date)
            ).values('amount', 'currency', 'category')
        )
        
        # Get deposit transactions
        user_deposit_on_range = list(
            Transactions.objects.filter(
                user=user,
                trans_status='deposit',
                date__range=(start_date, end_date)
            ).values('amount', 'currency', 'category')
        )

        total_withdraw = 0.0
        # Convert withdrawals to favorite currency
        for trans in user_withdraw_on_range:
            withdraw_totals = {}
            currency = trans["currency"]
            amount = float(trans["amount"])
            withdraw_totals[currency] = withdraw_totals.get(currency, 0) + amount
            total_withdraw_trans, _ = convert_to_fav_currency(request, withdraw_totals) if withdraw_totals else (0.0, user.favorite_currency or 'USD')
    
            if withdraw_totals.get(currency, 0) > 0:
                ratio = amount / withdraw_totals[currency]
                trans["converted_amount"] = ratio * total_withdraw_trans
            else:
                trans["converted_amount"] = 0
            total_withdraw += trans["converted_amount"]

        # Concatenate Withdraw transactions on the categories
        withdraw_categories = {}
        for trans in user_withdraw_on_range:
            category = trans["category"] or "Uncategorized"
            if category not in withdraw_categories:
                withdraw_categories[category] = trans["converted_amount"]
            else:
                withdraw_categories[category] += trans["converted_amount"]
        user_withdraw_on_range = [
            {"category": category, "converted_amount": amount}
            for category, amount in withdraw_categories.items()
        ]

        total_deposit = 0.0
        # Convert deposits to favorite currency
        for trans in user_deposit_on_range:
            deposit_totals = {}
            currency = trans["currency"]
            amount = float(trans["amount"])
            deposit_totals[currency] = deposit_totals.get(currency, 0) + amount
            total_deposit_trans, _ = convert_to_fav_currency(request, deposit_totals) if deposit_totals else (0.0, user.favorite_currency or 'USD')

            if deposit_totals.get(currency, 0) > 0:
                ratio = amount / deposit_totals[currency]
                trans["converted_amount"] = ratio * total_deposit_trans
            else:
                trans["converted_amount"] = 0
            total_deposit += trans["converted_amount"]

        # Concatenate Deposit transactions on the categories
        deposit_categories = {}
        for trans in user_deposit_on_range:
            category = trans["category"] or "Uncategorized"
            if category not in deposit_categories:
                deposit_categories[category] = trans["converted_amount"]
            else:
                deposit_categories[category] += trans["converted_amount"]
        user_deposit_on_range = [
            {"category": category, "converted_amount": amount}
            for category, amount in deposit_categories.items()
        ]
         
        # Calculate percentages
        withdraw_percentages = []
        deposit_percentages = []
        
        if user_withdraw_on_range and total_withdraw > 0:
            withdraw_percentages = [
                round((trans["converted_amount"] / total_withdraw) * 100, 1)
                for trans in user_withdraw_on_range
            ]
        
        if user_deposit_on_range and total_deposit > 0:
            deposit_percentages = [
                round((trans["converted_amount"] / total_deposit) * 100, 1)
                for trans in user_deposit_on_range
            ]
        return user_withdraw_on_range, user_deposit_on_range, withdraw_percentages, deposit_percentages, total_withdraw or 0.0, total_deposit or 0.0
        
    except Exception as e:
        print(f"Error in calculate_user_report: {e}")  # Print error message for debugging
        return [], [], [], [], 0.0, 0.0  # Return empty lists and zero totals on error

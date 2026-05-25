from django.db.models import Sum, Count, Case, When, Value, TextField  # Added TextField import
from transaction_management.models import Transactions
from finance_management.utils.currencies import convert_to_fav_currency

def calculate_user_report(start_date, end_date, user):
    """Calculate user spending report with category breakdowns, percentages, and totals."""
    if not user:
        return [], [], 0.0, 0.0  # Return empty lists and zero totals if invalid
    
    try:
        # Get withdrawal transactions
        user_withdraw_on_range = list(
            Transactions.objects.filter(
                user=user,
                trans_status__iexact='withdraw',
                date__range=(start_date, end_date)
            ).values('amount', 'currency', 'category', 'place')
        )
        
        # Get deposit transactions
        user_deposit_on_range = list(
            Transactions.objects.filter(
                user=user,
                trans_status__iexact='deposit',
                date__range=(start_date, end_date)
            ).values('amount', 'currency', 'category', 'place')
        )

        total_withdraw = 0.0
        # Convert withdrawals to favorite currency
        for trans in user_withdraw_on_range:
            withdraw_totals = {}
            currency = trans["currency"]
            amount = float(trans["amount"])
            withdraw_totals[currency] = withdraw_totals.get(currency, 0) + amount
            total_withdraw_trans, _ = convert_to_fav_currency(user, withdraw_totals) if withdraw_totals else (0.0, user.favorite_currency or 'USD')
    
            if withdraw_totals.get(currency, 0) > 0:
                ratio = amount / withdraw_totals[currency]
                trans["converted_amount"] = ratio * total_withdraw_trans
            else:
                trans["converted_amount"] = 0
            total_withdraw += trans["converted_amount"]

        # Concatenate Withdraw transactions on the categories and places
        withdraw_categories = {}
        withdraw_places = {}
        for trans in user_withdraw_on_range:
            raw_category = trans["category"]
            category = raw_category.strip().title() if raw_category and str(raw_category).strip() else "Uncategorized"
            raw_place = trans["place"]
            place = raw_place.strip().title() if raw_place and str(raw_place).strip() else "General"
            
            if category not in withdraw_categories:
                withdraw_categories[category] = trans["converted_amount"]
            else:
                withdraw_categories[category] += trans["converted_amount"]
                
            if place not in withdraw_places:
                withdraw_places[place] = trans["converted_amount"]
            else:
                withdraw_places[place] += trans["converted_amount"]
                
        user_withdraw_on_range_formatted = [
            {"category": category, "converted_amount": amount, "percentage": 0}
            for category, amount in withdraw_categories.items()
        ]
        user_withdraw_by_place = [
            {"place": place, "converted_amount": amount, "percentage": 0}
            for place, amount in withdraw_places.items()
        ]

        total_deposit = 0.0
        # Convert deposits to favorite currency
        for trans in user_deposit_on_range:
            deposit_totals = {}
            currency = trans["currency"]
            amount = float(trans["amount"])
            deposit_totals[currency] = deposit_totals.get(currency, 0) + amount
            total_deposit_trans, _ = convert_to_fav_currency(user, deposit_totals) if deposit_totals else (0.0, user.favorite_currency or 'USD')

            if deposit_totals.get(currency, 0) > 0:
                ratio = amount / deposit_totals[currency]
                trans["converted_amount"] = ratio * total_deposit_trans
            else:
                trans["converted_amount"] = 0
            total_deposit += trans["converted_amount"]

        # Concatenate Deposit transactions on the categories and places
        deposit_categories = {}
        deposit_places = {}
        for trans in user_deposit_on_range:
            raw_category = trans["category"]
            category = raw_category.strip().title() if raw_category and str(raw_category).strip() else "Uncategorized"
            raw_place = trans["place"]
            place = raw_place.strip().title() if raw_place and str(raw_place).strip() else "General"
            
            if category not in deposit_categories:
                deposit_categories[category] = trans["converted_amount"]
            else:
                deposit_categories[category] += trans["converted_amount"]
                
            if place not in deposit_places:
                deposit_places[place] = trans["converted_amount"]
            else:
                deposit_places[place] += trans["converted_amount"]
                
        user_deposit_on_range_formatted = [
            {"category": category, "converted_amount": amount, "percentage": 0}
            for category, amount in deposit_categories.items()
        ]
        user_deposit_by_place = [
            {"place": place, "converted_amount": amount, "percentage": 0}
            for place, amount in deposit_places.items()
        ]
        
        #calculate percentages
        if user_withdraw_on_range_formatted and total_withdraw > 0:
            for trans in user_withdraw_on_range_formatted:
                trans["percentage"] = round((trans["converted_amount"] / total_withdraw) * 100, 1)
        if user_withdraw_by_place and total_withdraw > 0:
            for trans in user_withdraw_by_place:
                trans["percentage"] = round((trans["converted_amount"] / total_withdraw) * 100, 1)

        if user_deposit_on_range_formatted and total_deposit > 0:
            for trans in user_deposit_on_range_formatted:
                trans["percentage"] = round((trans["converted_amount"] / total_deposit) * 100, 1)
        if user_deposit_by_place and total_deposit > 0:
            for trans in user_deposit_by_place:
                trans["percentage"] = round((trans["converted_amount"] / total_deposit) * 100, 1)

        user_withdraw_on_range_formatted = sorted(user_withdraw_on_range_formatted, key=lambda x: x['percentage'], reverse=True)
        user_withdraw_by_place = sorted(user_withdraw_by_place, key=lambda x: x['percentage'], reverse=True)
        
        user_deposit_on_range_formatted = sorted(user_deposit_on_range_formatted, key=lambda x: x['percentage'], reverse=True)
        user_deposit_by_place = sorted(user_deposit_by_place, key=lambda x: x['percentage'], reverse=True)

        return user_withdraw_on_range_formatted, user_deposit_on_range_formatted, user_withdraw_by_place, user_deposit_by_place, total_withdraw or 0.0, total_deposit or 0.0
        
    except Exception as e:
        print(f"Error in calculate_user_report: {str(e)}")
        return [], [], [], [], 0.0, 0.0  # Return empty lists and zero totals on error

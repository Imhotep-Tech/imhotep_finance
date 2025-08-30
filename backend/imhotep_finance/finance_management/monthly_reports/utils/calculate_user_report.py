from django.db.models import Sum, Count, Case, When, Value, TextField  # Added TextField import
from ...models import Transactions

def calculate_user_report(start_date, end_date, user):
    """Calculate user spending report with category breakdowns, percentages, and totals."""
    if not user:  # Validate user (Django User instance)
        return [], [], [], [], 0.0, 0.0  # Return empty lists and zero totals if invalid
    
    # try:
    #get withdrawal transactions grouped by category using Django ORM
    user_withdraw_on_range = (
        Transactions.objects.filter(
            user=user,
            trans_status='withdraw',
            date__range=(start_date, end_date)
        )
        .annotate(
            effective_category=Case(
                When(category__isnull=True, then=Value('Others')),
                When(category='', then=Value('Others')),
                default='category',
                output_field=TextField()  # Added to resolve type mismatch
            )
        )
        .values('effective_category')
        .annotate(
            total_amount=Sum('amount'),
            frequency_of_category=Count('effective_category')
        )
        .order_by('-total_amount')[:15]
    )
    
    #get deposit transactions grouped by category using Django ORM
    user_deposit_on_range = (
        Transactions.objects.filter(
            user=user,
            trans_status='deposit',
            date__range=(start_date, end_date)
        )
        .annotate(
            effective_category=Case(
                When(category__isnull=True, then=Value('Others')),
                When(category='', then=Value('Others')),
                default='category',
                output_field=TextField()  # Added to resolve type mismatch
            )
        )
        .values('effective_category')
        .annotate(
            total_amount=Sum('amount'),
            frequency_of_category=Count('effective_category')
        )
        .order_by('-total_amount')[:15]
    )
    
    # Ensure we return empty lists if no data (convert QuerySets to lists for consistency)
    user_withdraw_on_range = list(user_withdraw_on_range)
    user_deposit_on_range = list(user_deposit_on_range)
    
    # Calculate percentages for withdrawals
    withdraw_percentages = []  # Initialize withdrawal percentages list
    total_withdraw = 0.0  # Initialize total withdraw
    if user_withdraw_on_range:  # Check if withdrawal data exists
        total_withdraw = sum(float(row['total_amount']) for row in user_withdraw_on_range)
        if total_withdraw > 0:  # Check if total is greater than zero
            withdraw_percentages = [
                round((float(row['total_amount']) / total_withdraw) * 100, 1)
                for row in user_withdraw_on_range
            ]
        else:
            withdraw_percentages = [0] * len(user_withdraw_on_range)  # Set all percentages to zero
    
    # Calculate percentages for deposits
    deposit_percentages = []  # Initialize deposit percentages list
    total_deposit = 0.0  # Initialize total deposit
    if user_deposit_on_range:  # Check if deposit data exists
        total_deposit = sum(float(row['total_amount']) for row in user_deposit_on_range)
        if total_deposit > 0:  # Check if total is greater than zero
            deposit_percentages = [
                round((float(row['total_amount']) / total_deposit) * 100, 1)
                for row in user_deposit_on_range
            ]
        else:
            deposit_percentages = [0] * len(user_deposit_on_range)  # Set all percentages to zero
    
    return user_withdraw_on_range, user_deposit_on_range, withdraw_percentages, deposit_percentages, total_withdraw, total_deposit

    # except Exception as e:
    #     print(f"Error in calculate_user_report: {e}")  # Print error message
    #     return [], [], [], [], 0.0, 0.0  # Return empty lists and zero totals on error

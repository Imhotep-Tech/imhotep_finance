from transaction_management.models import Transactions
from datetime import date
import calendar


def get_transactions_for_user(
    *,
    user,
    start_date= None,
    end_date = None,
    category = None,
    trans_status = None,
    details_search = None
):
    """Get filtered transactions for a user."""
    
    # Set default date range to current month if not provided
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_date = today.replace(day=last_day)
    
    # Base query
    queryset = Transactions.objects.filter(
        user=user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')
    
    # Apply optional filters
    if category:
        queryset = queryset.filter(category=category)
    
    if trans_status and trans_status in ["Deposit", "Withdraw", "deposit", "withdraw"]:
        queryset = queryset.filter(trans_status=trans_status)
    
    if details_search:
        queryset = queryset.filter(trans_details__icontains=details_search)
    
    return queryset, start_date, end_date

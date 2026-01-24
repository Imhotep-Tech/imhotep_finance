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
    """Get filtered transactions for a user.
    
    Note: Since category and trans_details are encrypted fields, they cannot be
    filtered directly in the database. We filter them in memory after decryption.
    """
    
    # Set default date range to current month if not provided
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_date = today.replace(day=last_day)
    
    # Base query - filter by non-encrypted fields first
    queryset = Transactions.objects.filter(
        user=user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')
    
    # Apply trans_status filter (non-encrypted field)
    if trans_status and trans_status in ["Deposit", "Withdraw", "deposit", "withdraw"]:
        queryset = queryset.filter(trans_status=trans_status)
    
    # If we need to filter by encrypted fields (category or details_search),
    # we must filter in memory after decryption
    if category or details_search:
        # Convert queryset to list to access decrypted values
        transactions_list = list(queryset)
        filtered_transactions = []
        
        for trans in transactions_list:
            # Access encrypted fields (they are automatically decrypted when accessed)
            trans_category = trans.category or ""
            trans_details = trans.trans_details or ""
            
            # Apply category filter
            if category:
                if trans_category != category:
                    continue
            
            # Apply details_search filter
            if details_search:
                if details_search.lower() not in trans_details.lower():
                    continue
            
            filtered_transactions.append(trans)
        
        # Create a new queryset from filtered transactions
        # We'll use the IDs to create a filtered queryset
        if filtered_transactions:
            transaction_ids = [t.id for t in filtered_transactions]
            # Create queryset with filtered IDs, maintaining date order
            queryset = Transactions.objects.filter(id__in=transaction_ids).order_by('-date')
        else:
            # Return empty queryset if no matches
            queryset = Transactions.objects.none()
    
    return queryset, start_date, end_date

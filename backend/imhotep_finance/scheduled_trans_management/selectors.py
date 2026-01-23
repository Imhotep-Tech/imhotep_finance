from scheduled_trans_management.models import ScheduledTransaction


def get_scheduled_transactions_for_user(*, user, status_filter=None):
    """Get scheduled transactions for a user."""
    
    queryset = ScheduledTransaction.objects.filter(user=user).order_by('-created_at')
    
    if status_filter is not None:
        queryset = queryset.filter(status=status_filter)
    
    return queryset

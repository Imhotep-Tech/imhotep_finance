from wishlist_management.models import Wishlist
from django.utils import timezone


def get_wishlist_for_user(*, user, year=None):
    """Get wishlist for user filtered by year."""
    
    queryset = Wishlist.objects.filter(user=user)
    
    # Only filter by year if explicitly provided
    if year is not None:
        queryset = queryset.filter(year=year)
    
    return queryset.order_by('-created_at')
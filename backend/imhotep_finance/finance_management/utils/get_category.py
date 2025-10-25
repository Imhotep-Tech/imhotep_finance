from transaction_management.models import Transactions
from django.db.models import Count

def get_category(user, status="ANY"):
    """Get user's most frequently used categories."""
    if not user or not status: #validate input parameters
        return [] #return empty list if invalid

    qs = Transactions.objects.filter(user=user) #queryset for transactions of the user
    if status != "ANY": #check if specific status is requested
        qs = qs.filter(trans_status__iexact=status) #filter by transaction status

    qs = qs.exclude(category__isnull=True).exclude(category__exact="") #exclude null or empty categories

    # Annotate and order by frequency
    categories = (
        qs.values('category') #group by category
        .annotate(frequency_of_category=Count('category')) #count frequency of each category
        .order_by('-frequency_of_category')[:15] #order by frequency, limit to 15
    )

    # Extract just the category names
    return [row['category'] for row in categories] #return list of category names
from collections import Counter
from transaction_management.models import NetWorth


def get_places(user, currency="ANY"):
    """Get user's most frequently used places."""
    if not user or currency is None:  # validate input parameters
        return []

    qs = NetWorth.objects.filter(user=user)
    if currency != "ANY":
        qs = qs.filter(currency=currency)

    qs = qs.exclude(place__isnull=True).exclude(place__exact="")

    return [place for place, _ in Counter(tx.place for tx in qs.only("place")).most_common()]
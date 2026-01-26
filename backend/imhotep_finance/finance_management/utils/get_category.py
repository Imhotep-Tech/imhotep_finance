from collections import Counter
from transaction_management.models import Transactions


def get_category(user, status="ANY"):
    """Get user's most frequently used categories."""
    if not user or status is None:  # validate input parameters
        return []

    qs = Transactions.objects.filter(user=user)
    if status != "ANY":
        qs = qs.filter(trans_status__iexact=status)

    qs = qs.exclude(category__isnull=True).exclude(category__exact="")

    # Grouping on an encrypted column is non-deterministic, so count in Python after decryption
    category_list = [c for c in (tx.category for tx in qs.only("category")) if c and c.strip()]
    return [category for category, _ in Counter(category_list).most_common()]

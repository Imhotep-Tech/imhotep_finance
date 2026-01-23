from target_management.models import Target
from datetime import date
from typing import Optional


def get_target_for_user(*, user, month: Optional[int] = None, year: Optional[int] = None):
    """Get target for user. Defaults to current month if not specified."""
    
    if month is None or year is None:
        today = date.today()
        month = month or today.month
        year = year or today.year
    
    return Target.objects.filter(
        user=user,
        month=month,
        year=year
    ).first()


def get_all_targets_for_user(*, user):
    """Get all targets for a user ordered by date descending."""
    return Target.objects.filter(user=user).order_by('-year', '-month')


def get_latest_target_for_user(*, user):
    """Get the most recent target for a user."""
    return Target.objects.filter(user=user).order_by('-year', '-month').first()

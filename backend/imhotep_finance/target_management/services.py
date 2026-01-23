from django.core.exceptions import ValidationError
from target_management.models import Target
from transaction_management.models import Transactions
from datetime import datetime
from django.db import transaction as db_transaction
from finance_management.utils.currencies import convert_to_fav_currency


def create_target_for_user(*, user, target_value):
    """Create or update target for the user."""
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if target_value is None or target_value <= 0:
        raise ValidationError("Target value must be greater than zero!")
    
    now = datetime.now()
    month = now.month
    year = now.year

    # Check if a target already exists for this month and year
    target_obj, created = Target.objects.get_or_create(
        user=user,
        month=month,
        year=year,
        defaults={'target': target_value, 'score': 0}
    )

    if not created:
        # Update existing target
        target_obj.target = target_value
        target_obj.save()

    return target_obj


def calculate_score(*, user, target_obj):
    """Calculate score for the user based on transactions and target."""
    now = datetime.now()

    target_db = target_obj.target
    month_db = target_obj.month
    year_db = target_obj.year

    current_month = now.month
    current_year = now.year

    # If it's a new month/year, create a fresh target record
    if month_db != current_month or year_db != current_year:
        try:
            target_obj = Target.objects.create(
                user=user,
                target=target_db,
                month=current_month,
                year=current_year,
                score=0
            )
        except Exception:
            raise ValidationError('Error creating new target for the month/year')

    # Define date range for this month
    first_day_current_month = now.replace(day=1)
    if now.month == 12:
        first_day_next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        first_day_next_month = now.replace(month=now.month + 1, day=1)

    from_date = first_day_current_month.date()
    to_date = first_day_next_month.date()

    # Transactions for deposits and withdrawals this month
    score_deposit = Transactions.objects.filter(
        user=user,
        date__gte=from_date,
        date__lt=to_date,
        trans_status__in=['Deposit', 'deposit']
    ).values_list("amount", "currency")

    score_withdraw = Transactions.objects.filter(
        user=user,
        date__gte=from_date,
        date__lt=to_date,
        trans_status__in=['withdraw', 'Withdraw']
    ).values_list("amount", "currency")

    # Aggregate deposits
    currency_totals_deposit = {}
    for amount, currency in score_deposit:
        amount = float(amount)
        currency_totals_deposit[currency] = currency_totals_deposit.get(currency, 0) + amount
    total_favorite_currency_deposit, _ = convert_to_fav_currency(user, currency_totals_deposit)

    # Aggregate withdrawals
    currency_totals_withdraw = {}
    for amount, currency in score_withdraw:
        amount = float(amount)
        currency_totals_withdraw[currency] = currency_totals_withdraw.get(currency, 0) + amount
    total_favorite_currency_withdraw, _ = convert_to_fav_currency(user, currency_totals_withdraw)

    # Calculate score (deposits - target - withdrawals)
    score = (total_favorite_currency_deposit - target_obj.target) - total_favorite_currency_withdraw

    if score == 0:
        score_txt = "On target"
    elif score > 0:
        score_txt = "Above target"
    else:
        score_txt = "Below target"

    # Save score in the latest target
    try:
        target_obj.score = int(score)
        target_obj.save()
    except Exception:
        raise ValidationError('Error saving score')

    return target_obj, score_txt, score
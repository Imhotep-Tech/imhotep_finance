from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from transaction_management.models import Transactions
from target_management.models import Target
from datetime import datetime
from finance_management.utils.currencies import convert_to_fav_currency
from drf_yasg.utils import swagger_auto_schema
from .schemas.target_schemas import get_score_response

@swagger_auto_schema(
    method='get',
    operation_description='Get current month score relative to target.',
    responses={
        200: get_score_response,
        404: 'Target not found',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_score(request):
    """Return score with respect to the target for the current month for the logged-in user."""
    now = datetime.now()
    user = request.user

    if not user:
        return Response(
            {'error': 'User Not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get the latest target for this user
    target_obj = Target.objects.filter(user=user).order_by('-created_at').first()
    if not target_obj:
        return Response(
            {'error': 'Target not found'},
            status=status.HTTP_404_NOT_FOUND
        )

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
            )
        except Exception:
            return Response(
                {'error': f'Failed to save new target'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
    total_favorite_currency_deposit, _ = convert_to_fav_currency(request, currency_totals_deposit)

    # Aggregate withdrawals
    currency_totals_withdraw = {}
    for amount, currency in score_withdraw:
        amount = float(amount)
        currency_totals_withdraw[currency] = currency_totals_withdraw.get(currency, 0) + amount
    total_favorite_currency_withdraw, _ = convert_to_fav_currency(request, currency_totals_withdraw)

    # Calculate score
    score = (total_favorite_currency_deposit - target_obj.target ) - total_favorite_currency_withdraw

    if score == 0:
        score_txt = "On target"
    elif score > 0:
        score_txt = "Below target"
    else:
        score_txt = "Above target"

    # Save score in the latest target
    try:
        target_obj.score = score
        target_obj.save()
    except Exception:
        return Response(
            {'error': f'Error saving score'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    response_data = {
        "score": score,
        "target": target_obj.target,
        "month": target_obj.month,
        "year": target_obj.year,
        "score_txt": score_txt
    }
    return Response(response_data, status=status.HTTP_200_OK)

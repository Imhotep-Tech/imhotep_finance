from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Transactions, Target
from datetime import datetime, date
from  ..utils.currencies import convert_to_fav_currency

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_score(request):
    """Return score with respect to the target for the current month for the logged-in user."""
    now = datetime.now()
    user = request.user

    # Filter Target by user
    target_qs = get_object_or_404(
        Target.objects.filter(user=user).order_by('-created_at')
    )

    target_db = target_qs.target #get latest target amount
    month_db = target_qs.month #get target month from database
    year_db = target_qs.year #get target year from database

    current_month = now.month #get current month
    current_year = now.year #get current year

    #if this is a new month with the year then add the new monthly data to the database 
    if month_db != current_month or year_db != current_year: #check if new month or year
        #insert a new target
        try:
            target_qs = Target.objects.create(
                user=user,
                target=target_db,
                month=current_month,
                year=current_year,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to save transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    first_day_current_month = now.replace(day=1) #get first day of current month

    if now.month == 12: #check if december
        first_day_next_month = now.replace(year=now.year + 1, month=1, day=1) #set to january next year
    else:
        first_day_next_month = now.replace(month=now.month + 1, day=1) #set to first day next month

    from_date = first_day_current_month.date() #set start date for current month
    to_date = first_day_next_month.date() #set end date for current month

    score_deposit = Transactions.objects.filter(
            user=request.user,
            date__gte=from_date,
            date__lt=to_date,
            trans_status="deposit"
        ).values_list("amount", "currency")

    score_withdraw = Transactions.objects.filter(
            user=request.user,
            date__gte=from_date,
            date__lt=to_date,
            trans_status="withdraw"
        ).values_list("amount", "currency")

    # Aggregate deposits by currency
    currency_totals_deposit = {}
    for amount, currency in score_deposit:
        amount = float(amount)
        currency_totals_deposit[currency] = currency_totals_deposit.get(currency, 0) + amount

    total_favorite_currency_deposit, _ = convert_to_fav_currency(request, currency_totals_deposit)

    # Aggregate withdrawals by currency
    currency_totals_withdraw = {}
    for amount, currency in score_withdraw:
        amount = float(amount)
        currency_totals_withdraw[currency] = currency_totals_withdraw.get(currency, 0) + amount

    total_favorite_currency_withdraw, _ = convert_to_fav_currency(request, currency_totals_withdraw)

    score = total_favorite_currency_deposit - total_favorite_currency_withdraw - target_db #calculate target score
    
    if score == 0:
        score_txt = "On target"
    elif score > 0:
        score_txt = "Above target"
    else:
        score_txt = "Below target"

    try:
        target_qs.score = score
        target_qs.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while saving: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    response_data = {
        "score": score,
        "target": target_db,
        "month": current_month,
        "year": current_year,
        "score_txt":score_txt
    }
    return Response(response_data, status=status.HTTP_200_OK)


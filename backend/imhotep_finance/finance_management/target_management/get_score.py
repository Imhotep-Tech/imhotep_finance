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
    now = datetime.datetime.now()
    user = request.user

    # Filter Target by user
    target_qs = get_object_or_404(
        Target.objects.order_by('-created_at'),
        user=request.user
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
            new_target = Target.objects.create(
                user=user,
                target=target_db,
                month=current_month,
                year=current_year,
            )
            new_target.save()
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
            date__lte=to_date,
            status="deposit"
        ).order_by('-date').all()

    score_withdraw = Transactions.objects.filter(
            user=request.user,
            date__gte=from_date,
            date__lte=to_date,
            status="withdraw"
        ).order_by('-date').all()

    currency_totals_deposit = {} #initialize deposit totals by currency
    for amount, currency in score_deposit: #iterate through deposits
        amount = float(amount) #convert amount to float
        if currency in currency_totals_deposit: #check if currency already exists
            currency_totals_deposit[currency] += amount #add to existing total
        else:
            currency_totals_deposit[currency] = amount #create new currency entry
    total_favorite_currency_deposit, favorite_currency_deposit = convert_to_fav_currency(request, currency_totals_deposit) #convert deposits to favorite currency

    currency_totals_withdraw= {} #initialize withdrawal totals by currency
    for amount, currency in score_withdraw: #iterate through withdrawals
        amount = float(amount) #convert amount to float
        if currency in currency_totals_withdraw: #check if currency already exists
            currency_totals_withdraw[currency] += amount #add to existing total
        else:
            currency_totals_withdraw[currency] = amount #create new currency entry
    total_favorite_currency_withdraw, favorite_currency_withdraw = convert_to_fav_currency(request, currency_totals_withdraw) #convert withdrawals to favorite currency

    score = (total_favorite_currency_deposit - target_db) - total_favorite_currency_withdraw #calculate target score
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
        "target": target_db
    }
    return Response(response_data, status=status.HTTP_200_OK)

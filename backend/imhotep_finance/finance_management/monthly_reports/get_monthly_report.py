from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .utils.calculate_user_report import calculate_user_report

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_monthly_reports(request):
    """Return monthly reports for the logged-in user"""
    try:
        user = request.user

        # Get current date
        now = datetime.now() #get current datetime
        
        # Start date: first day of current month
        start_date = now.replace(day=1).date() #set start date to first day of month
        
        # End date: first day of next month
        if now.month == 12: #check if december
            end_date = now.replace(year=now.year + 1, month=1, day=1).date() #set to january next year
        else:
            end_date = now.replace(month=now.month + 1, day=1).date() #set to first day next month

        (
            user_withdraw_on_range,
            user_deposit_on_range,
            withdraw_percentages,
            deposit_percentages,
            total_withdraw,
            total_deposit,
        ) = calculate_user_report(start_date, end_date, user) #calculate monthly report data

        response_data = {
            "user_withdraw_on_range": user_withdraw_on_range, 
            "user_deposit_on_range": user_deposit_on_range,
            "withdraw_percentages": withdraw_percentages,
            "deposit_percentages": deposit_percentages,
            "total_withdraw": total_withdraw,
            "total_deposit": total_deposit,
            "current_month": now.strftime("%B %Y"),
            "favorite_currency": user.favorite_currency or 'USD'  # Add favorite currency
        }
        print(response_data)
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Error Happened: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .utils.calculate_user_report import calculate_user_report
import calendar

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yearly_reports(request):
    """Return yearly reports for the logged-in user"""
    try:
        user = request.user

        # Get current date
        now = datetime.now() #get current datetime
        
        # Start date: first day of current year
        start_date = now.replace(month=1, day=1).date()
        # End date: last day of current year
        end_date = now.replace(month=12, day=31).date()
        (
            user_withdraw_on_range,
            user_deposit_on_range,
            withdraw_percentages,
            deposit_percentages,
            total_withdraw,
            total_deposit,
        ) = calculate_user_report(start_date, end_date, user, request) #calculate monthly report data

        response_data = {
            "user_withdraw_on_range": [
                {
                    "category": item['category'],
                    "converted_amount": float(item['converted_amount']),
                }
                for item in user_withdraw_on_range
            ],
            "user_deposit_on_range": [
                {
                    "category": item['category'],
                    "converted_amount": float(item['converted_amount']),
                }
                for item in user_deposit_on_range
            ],
            "withdraw_percentages": withdraw_percentages,
            "deposit_percentages": deposit_percentages,
            "total_withdraw": float(total_withdraw) if total_withdraw is not None else 0.0,
            "total_deposit": float(total_deposit) if total_deposit is not None else 0.0,
            "current_month": now.strftime("%B %Y"),
            "favorite_currency": user.favorite_currency or 'USD'  # Add favorite currency
        }

        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Monthly report error")  # Add detailed error logging
        return Response(
            {'error': f'Error in generating monthly report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

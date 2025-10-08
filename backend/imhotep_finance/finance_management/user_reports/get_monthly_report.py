from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .utils.calculate_user_report import calculate_user_report
from .utils.save_user_report import save_user_report
import calendar

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_monthly_reports(request):
    """Return monthly reports for the logged-in user"""
    try:
        user = request.user

        # Get current date
        now = datetime.now()
        
        # Get date range from query params or use current month as default
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
       
        if not start_date:
            # Default to first day of current month
            start_date = now.replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            
        if not end_date:
            # Default to last day of current month
            last_day = calendar.monthrange(now.year, now.month)[1]
            end_date = now.replace(day=last_day).date()
        else:
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Calculate report data for the specified date range
        (
            user_withdraw_on_range,
            user_deposit_on_range,
            total_withdraw,
            total_deposit,
        ) = calculate_user_report(start_date, end_date, user, request)

        # Format the month display based on the date range
        if start_date.month == end_date.month and start_date.year == end_date.year:
            current_month = start_date.strftime("%B %Y")
        else:
            current_month = f"{start_date.strftime('%B %Y')} - {end_date.strftime('%B %Y')}"

        response_data = {
            "user_withdraw_on_range": [
                {
                    "category": item['category'],
                    "converted_amount": float(item['converted_amount']),
                    "percentage": float(item.get('percentage', 0))
                }
                for item in user_withdraw_on_range
            ],
            "user_deposit_on_range": [
                {
                    "category": item['category'],
                    "converted_amount": float(item['converted_amount']),
                    "percentage": float(item.get('percentage', 0))
                }
                for item in user_deposit_on_range
            ],
            "total_withdraw": float(total_withdraw) if total_withdraw is not None else 0.0,
            "total_deposit": float(total_deposit) if total_deposit is not None else 0.0,
            "current_month": current_month,
            "favorite_currency": user.favorite_currency or 'USD',
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }

        # Save the report data only if it's for a complete month
        if start_date.day == 1 and end_date == datetime(start_date.year, start_date.month, calendar.monthrange(start_date.year, start_date.month)[1]).date():
            success, error = save_user_report(user, start_date, response_data)
            if error:
                print(f"Error saving report: {error}")
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Monthly report error: {str(e)}")
        return Response(
            {'error': f'Error in generating monthly report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

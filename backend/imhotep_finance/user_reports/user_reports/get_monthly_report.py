from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, date
from .utils.calculate_user_report import calculate_user_report
from .utils.save_user_report import save_user_report
import calendar
from user_reports.models import Reports
from drf_yasg.utils import swagger_auto_schema
from .schemas.report_schemas import get_monthly_report_response

@swagger_auto_schema(
    method='get',
    operation_description='Get monthly report for current month (from cache if available).',
    responses={
        200: get_monthly_report_response,
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_monthly_reports(request):
    """Return monthly report for the logged-in user"""
    try:
        user = request.user
        now = datetime.now()

        # First, check if we have a saved report for the current month
        user_report = Reports.objects.filter(user=user, month=now.month, year=now.year).first()
        
        if user_report:
            # Return the saved report data
            return Response(user_report.data, status=status.HTTP_200_OK)
        
        # If no saved report exists, calculate it in real-time
        # Calculate first and last day of current month
        first_day = date(now.year, now.month, 1)
        last_day_of_month = calendar.monthrange(now.year, now.month)[1]
        last_day = date(now.year, now.month, last_day_of_month)

        # Calculate report data for current month
        (
            user_withdraw_on_range,
            user_deposit_on_range,
            total_withdraw,
            total_deposit,
        ) = calculate_user_report(first_day, last_day, user, request)

        # Prepare response data
        month_name = calendar.month_name[now.month]
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
            "current_month": f"{month_name} {now.year}",
            "favorite_currency": user.favorite_currency or 'USD'
        }

        # Save the report for this month (create or update)
        save_user_report(user, first_day, response_data)
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Monthly report error: {str(e)}")  # Log detailed error for debugging
        return Response(
            {'error': 'Unable to generate monthly report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
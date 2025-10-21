from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, date
from .utils.calculate_user_report import calculate_user_report
from .utils.save_user_report import save_user_report
import calendar
from transaction_management.models import Transactions
from drf_yasg.utils import swagger_auto_schema
from .schemas.report_schemas import recalculate_reports_response

@swagger_auto_schema(
    method='post',
    operation_description='Recalculate all monthly reports for the user across the full transaction date range.',
    responses={
        200: recalculate_reports_response,
        200: 'No transactions found for this user',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_reports(request):
    """Recalculate all monthly reports for the logged-in user from first to last transaction"""
    try:
        user = request.user
        
        # Get the date range of all user transactions
        transaction_dates = Transactions.objects.filter(user=user).values_list('date', flat=True).order_by('date')
        
        if not transaction_dates:
            return Response(
                {'message': 'No transactions found for this user'},
                status=status.HTTP_200_OK
            )
        
        first_date = transaction_dates.first()
        last_date = transaction_dates.last()
        
        # Generate all months between first and last transaction
        current_date = date(first_date.year, first_date.month, 1)
        end_date = date(last_date.year, last_date.month, 1)
        
        processed_months = []
        total_processed = 0
        total_created = 0
        total_updated = 0
        errors = []
        
        while current_date <= end_date:
            try:
                # Calculate first and last day of current month
                first_day = current_date
                last_day_of_month = calendar.monthrange(current_date.year, current_date.month)[1]
                last_day = date(current_date.year, current_date.month, last_day_of_month)
                
                # Calculate report data for this month
                (
                    user_withdraw_on_range,
                    user_deposit_on_range,
                    total_withdraw,
                    total_deposit,
                ) = calculate_user_report(first_day, last_day, user, request)
                
                # Prepare response data structure
                month_name = calendar.month_name[current_date.month]
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
                    "current_month": f"{month_name} {current_date.year}",
                    "favorite_currency": user.favorite_currency or 'USD',
                    "start_date": first_day.isoformat(),
                    "end_date": last_day.isoformat()
                }
                
                # Save the report for this month
                success, error = save_user_report(user, first_day, response_data)
                
                if success:
                    # Check if it was created or updated by checking if report existed
                    from user_reports.models import Reports
                    existing_report = Reports.objects.filter(
                        user=user, 
                        month=current_date.month, 
                        year=current_date.year
                    ).first()
                    
                    if existing_report:
                        total_updated += 1
                    else:
                        total_created += 1
                    
                    processed_months.append({
                        'month': current_date.month,
                        'year': current_date.year,
                        'month_name': f"{month_name} {current_date.year}",
                        'total_transactions': len(user_withdraw_on_range) + len(user_deposit_on_range),
                        'total_withdraw': float(total_withdraw) if total_withdraw else 0.0,
                        'total_deposit': float(total_deposit) if total_deposit else 0.0,
                        'status': 'updated' if existing_report else 'created'
                    })
                    total_processed += 1
                else:
                    errors.append({
                        'month': f"{month_name} {current_date.year}",
                        'error': error
                    })
                
            except Exception as month_error:
                errors.append({
                    'month': f"{calendar.month_name[current_date.month]} {current_date.year}",
                    'error': str(month_error)
                })
            
            # Move to next month
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                current_date = date(current_date.year, current_date.month + 1, 1)
        
        # Prepare final response
        response_data = {
            'message': 'Report recalculation completed',
            'summary': {
                'total_months_processed': total_processed,
                'months_created': total_created,
                'months_updated': total_updated,
                'errors_count': len(errors),
                'date_range': {
                    'from': f"{calendar.month_name[first_date.month]} {first_date.year}",
                    'to': f"{calendar.month_name[last_date.month]} {last_date.year}"
                }
            },
            'processed_months': processed_months,
            'errors': errors if errors else None
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Recalculate reports error: {str(e)}")
        return Response(
            {'error': f'Error in recalculating reports: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

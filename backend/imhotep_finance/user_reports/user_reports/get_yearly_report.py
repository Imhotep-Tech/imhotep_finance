from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, date
from user_reports.models import Reports
from django.utils import timezone
import calendar
from drf_yasg.utils import swagger_auto_schema
from .schemas.report_schemas import get_report_history_years_response, get_yearly_report_params, get_yearly_report_response

@swagger_auto_schema(
    method='get',
    operation_description='List available years with reports.',
    responses={
        200: get_report_history_years_response,
        404: 'No report history found',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_history_years(request):
    """Return available report years for the logged-in user"""
    try:
        user = request.user

        # Get distinct years from user reports
        user_report_history = Reports.objects.filter(user=user).values('year').distinct().order_by('-year')
        
        if not user_report_history:
            return Response(
                {'error': 'No report history found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response_data = {
            "report_history_years": [item['year'] for item in user_report_history]
        }
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Report history years error: {str(e)}")
        return Response(
            {'error': 'Error in retrieving report history years'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    manual_parameters=get_yearly_report_params,
    operation_description='Get yearly aggregated report across available monthly reports.',
    responses={
        200: get_yearly_report_response,
        404: 'No reports for year',
        400: 'Invalid year',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_yearly_reports(request):
    """Return aggregated yearly report for the logged-in user"""
    try:
        user = request.user

        now = timezone.now()
        year = request.query_params.get('year')
        
        if year:
            try:
                year = int(year)
            except ValueError:
                return Response(
                    {'error': 'Year must be a valid integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            year = now.year

        # Get all monthly reports for the specified year
        monthly_reports = Reports.objects.filter(user=user, year=year).order_by('month')
        
        if not monthly_reports.exists():
            return Response(
                {'error': f'No reports found for year {year}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Aggregate data from all monthly reports
        total_withdraw = 0.0
        total_deposit = 0.0
        withdraw_categories = {}
        deposit_categories = {}
        
        for monthly_report in monthly_reports:
            data = monthly_report.data
            
            # Add to yearly totals
            total_withdraw += data.get('total_withdraw', 0)
            total_deposit += data.get('total_deposit', 0)
            
            # Aggregate withdraw categories
            for item in data.get('user_withdraw_on_range', []):
                category = item['category']
                amount = item['converted_amount']
                withdraw_categories[category] = withdraw_categories.get(category, 0) + amount
            
            # Aggregate deposit categories
            for item in data.get('user_deposit_on_range', []):
                category = item['category']
                amount = item['converted_amount']
                deposit_categories[category] = deposit_categories.get(category, 0) + amount
        
        # Convert category dictionaries to lists with percentages
        user_withdraw_on_range = []
        if total_withdraw > 0:
            for category, amount in withdraw_categories.items():
                percentage = round((amount / total_withdraw) * 100, 1)
                user_withdraw_on_range.append({
                    "category": category,
                    "converted_amount": float(amount),
                    "percentage": percentage
                })
            user_withdraw_on_range.sort(key=lambda x: x['percentage'], reverse=True)
        
        user_deposit_on_range = []
        if total_deposit > 0:
            for category, amount in deposit_categories.items():
                percentage = round((amount / total_deposit) * 100, 1)
                user_deposit_on_range.append({
                    "category": category,
                    "converted_amount": float(amount),
                    "percentage": percentage
                })
            user_deposit_on_range.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Prepare response data structure
        response_data = {
            "user_withdraw_on_range": user_withdraw_on_range,
            "user_deposit_on_range": user_deposit_on_range,
            "total_withdraw": float(total_withdraw),
            "total_deposit": float(total_deposit),
            "current_month": f"Year {year}",
            "favorite_currency": user.favorite_currency or 'USD',
            "year": year,
            "months_included": monthly_reports.count()
        }
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Yearly report error: {str(e)}")
        return Response(
            {'error': 'Error in retrieving yearly report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
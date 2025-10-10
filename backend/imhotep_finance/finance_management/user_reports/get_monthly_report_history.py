from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from .utils.calculate_user_report import calculate_user_report
from .utils.save_user_report import save_user_report
import calendar
from ..models import Reports
from drf_yasg.utils import swagger_auto_schema
from .schemas.report_schemas import (
    get_report_history_months_response,
    get_monthly_report_history_params,
    get_monthly_report_history_response,
)

@swagger_auto_schema(
    method='get',
    operation_description='List available month/year combinations for which reports exist.',
    responses={
        200: get_report_history_months_response,
        404: 'No report history found',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_history_months(request):
    """Return available report months/years for the logged-in user"""
    try:
        user = request.user
        
        # Use distinct on specific fields for better performance
        user_report_history = Reports.objects.filter(user=user).values('month', 'year').distinct().order_by('-year', '-month')
        
        if not user_report_history:
            return Response(
                {'error': 'No report history found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response_data = {
            "report_history_months": list(user_report_history)
        }
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Report history months error: {str(e)}")
        return Response(
            {'error': 'Error in retrieving report history months'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@swagger_auto_schema(
    method='get',
    manual_parameters=get_monthly_report_history_params,
    operation_description='Get a specific month report from history (stored snapshot).',
    responses={
        200: get_monthly_report_history_response,
        404: 'No report for month/year',
        400: 'Missing or invalid query params',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_monthly_report_history(request):
    """Return specific monthly report for the logged-in user"""
    try:
        user = request.user

        month = request.query_params.get('month')
        year = request.query_params.get('year')

        # Validate required parameters
        if not month or not year:
            return Response(
                {'error': 'Month and year parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {'error': 'Month and year must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_report = Reports.objects.filter(user=user, month=month, year=year).first()
        
        if not user_report:
            return Response(
                {'error': 'No report found for the specified month and year'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return the stored report data
        response_data = {
            "report_data": user_report.data,
            "month": user_report.month,
            "year": user_report.year,
            "created_at": user_report.created_at
        }
            
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Monthly report history error: {str(e)}")
        return Response(
            {'error': 'Error in retrieving monthly report history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
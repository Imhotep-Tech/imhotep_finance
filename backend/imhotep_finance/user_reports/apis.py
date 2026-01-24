from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from user_reports.services import (
    get_report_history_months_for_user,
    get_monthly_report_for_user,
    get_report_history_years_for_user,
    get_yearly_report_for_user,
    recalculate_all_reports_for_user
)
from user_reports.serializers import (
    ReportHistoryMonthsResponseSerializer,
    MonthlyReportQuerySerializer,
    MonthlyReportResponseSerializer,
    YearQuerySerializer,
    ReportHistoryYearsResponseSerializer,
    YearlyReportResponseSerializer,
    RecalculateReportsResponseSerializer
)
from rest_framework.exceptions import ValidationError as DRFValidationError

@method_decorator(csrf_exempt, name='dispatch')
class ReportHistoryMonthsApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Reports'],
        responses={
            200: ReportHistoryMonthsResponseSerializer,
            404: 'No report history found',
            500: 'Internal server error'
        },
        description='List available month/year combinations for which reports exist.',
        operation_id='get_report_history_months'
    )
    def get(self, request):
        """Return available report months/years for the logged-in user."""
        try:
            report_history = get_report_history_months_for_user(user=request.user)
            
            if not report_history:
                return Response(
                    {'error': 'No report history found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                "report_history_months": report_history
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Report history months error: {str(e)}")
            return Response(
                {'error': 'Error in retrieving report history months'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class MonthlyReportHistoryApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Reports'],
        parameters=[
            OpenApiParameter(
                name='month',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Month (1-12)',
                required=True
            ),
            OpenApiParameter(
                name='year',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Year (e.g., 2024)',
                required=True
            )
        ],
        responses={
            200: MonthlyReportResponseSerializer,
            400: 'Missing or invalid query params',
            404: 'No report for month/year',
            500: 'Internal server error'
        },
        description='Get a specific month report from history (stored snapshot).',
        operation_id='get_monthly_report_history'
    )
    def get(self, request):
        """Return specific monthly report for the logged-in user."""
        try:
            # Validate query parameters
            query_serializer = MonthlyReportQuerySerializer(data=request.query_params)
            query_serializer.is_valid(raise_exception=True)
            
            month = query_serializer.validated_data['month']
            year = query_serializer.validated_data['year']
            
            # Get monthly report
            report_response = get_monthly_report_for_user(
                user=request.user,
                month=month,
                year=year
            )
            
            return Response(report_response, status=status.HTTP_200_OK)
            
        except DRFValidationError as e:
            # Handle serializer validation errors (400)
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            # Handle service validation errors
            error_msg = str(e)
            if "not found" in error_msg.lower() or "no report" in error_msg.lower():
                return Response({'error': error_msg}, status=status.HTTP_404_NOT_FOUND)
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Monthly report history error: {str(e)}")
            return Response(
                {'error': 'Error in retrieving monthly report history'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ReportHistoryYearsApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Reports'],
        responses={
            200: ReportHistoryYearsResponseSerializer,
            404: 'No report history found',
            500: 'Internal server error'
        },
        description='List available years for which reports exist.',
        operation_id='get_report_history_years'
    )
    def get(self, request):
        """Return available report years for the logged-in user."""
        try:
            report_years = get_report_history_years_for_user(user=request.user)
            
            if not report_years:
                return Response(
                    {'error': 'No report history found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                "report_history_years": report_years
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Report history years error: {str(e)}")
            return Response(
                {'error': 'Error in retrieving report history years'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class YearlyReportApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Reports'],
        parameters=[
            OpenApiParameter(
                name='year',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Year (e.g., 2024). Defaults to current year if not provided.',
                required=False
            )
        ],
        responses={
            200: YearlyReportResponseSerializer,
            400: 'Invalid year',
            404: 'No reports for year',
            500: 'Internal server error'
        },
        description='Get yearly aggregated report across available monthly reports.',
        operation_id='get_yearly_report'
    )
    def get(self, request):
        """Return aggregated yearly report for the logged-in user."""
        try:
            # Validate query parameters
            query_serializer = YearQuerySerializer(data=request.query_params)
            query_serializer.is_valid(raise_exception=True)
            
            year = query_serializer.validated_data.get('year')
            
            # Get yearly report
            report_response = get_yearly_report_for_user(
                user=request.user,
                year=year
            )
            
            return Response(report_response, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                return Response({'error': error_msg}, status=status.HTTP_404_NOT_FOUND)
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Yearly report error: {str(e)}")
            return Response(
                {'error': 'Error in retrieving yearly report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RecalculateReportsApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Reports'],
        responses={
            200: RecalculateReportsResponseSerializer,
            500: 'Internal server error'
        },
        description='Recalculate all monthly reports for the user across the full transaction date range.',
        operation_id='recalculate_reports'
    )
    def post(self, request):
        """Recalculate all monthly reports for the logged-in user from first to last transaction."""
        try:
            result = recalculate_all_reports_for_user(user=request.user)
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Recalculate reports error: {str(e)}")
            return Response(
                {'error': f'Error in recalculating reports: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

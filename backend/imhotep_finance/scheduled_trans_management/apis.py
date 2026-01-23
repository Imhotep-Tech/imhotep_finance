from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from django.http import Http404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from scheduled_trans_management.services import (
    create_scheduled_transaction,
    delete_scheduled_transaction,
    update_scheduled_transaction,
    toggle_scheduled_transaction_status,
    apply_scheduled_transactions
)
from scheduled_trans_management.selectors import get_scheduled_transactions_for_user
from scheduled_trans_management.serializers import (
    ScheduledTransactionInputSerializer,
    ScheduledTransactionFilterSerializer,
    ScheduledTransactionListResponseSerializer
)
from finance_management.utils.serializer import serialize_scheduled_trans


@method_decorator(csrf_exempt, name='dispatch')
class ScheduledTransactionCreateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=ScheduledTransactionInputSerializer,
        responses={
            201: 'Scheduled transaction created successfully',
            400: 'Bad request - Validation error',
            500: 'Internal server error'
        }
    )
    def post(self, request):
        """Create a scheduled transaction."""
        serializer = ScheduledTransactionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            data = serializer.validated_data
            
            scheduled_trans = create_scheduled_transaction(
                user=request.user,
                day_of_month=data['day_of_month'],
                amount=data['amount'],
                currency=data['currency'],
                scheduled_trans_status=data['scheduled_trans_status'],
                category=data.get('category'),
                scheduled_trans_details=data.get('scheduled_trans_details')
            )
            
            return Response({
                "success": True,
                "message": "Scheduled transaction created successfully",
                "id": scheduled_trans.id
            }, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating scheduled transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while creating the scheduled transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ScheduledTransactionDeleteApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: 'Scheduled transaction deleted successfully',
            404: 'Scheduled transaction not found',
            500: 'Internal server error'
        }
    )
    def delete(self, request, scheduled_trans_id):
        """Delete a scheduled transaction."""
        try:
            delete_scheduled_transaction(
                user=request.user,
                scheduled_trans_id=scheduled_trans_id
            )
            
            return Response({
                "success": True,
                "message": "Scheduled transaction deleted successfully"
            }, status=status.HTTP_200_OK)
            
        except Http404:
            return Response(
                {"error": "Scheduled transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error deleting scheduled transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while deleting the scheduled transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ScheduledTransactionUpdateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=ScheduledTransactionInputSerializer,
        responses={
            200: 'Scheduled transaction updated successfully',
            400: 'Bad request - Validation error',
            404: 'Scheduled transaction not found',
            500: 'Internal server error'
        }
    )
    def post(self, request, scheduled_trans_id):
        """Update a scheduled transaction."""
        serializer = ScheduledTransactionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            data = serializer.validated_data
            
            update_scheduled_transaction(
                user=request.user,
                scheduled_trans_id=scheduled_trans_id,
                day_of_month=data['day_of_month'],
                amount=data['amount'],
                currency=data['currency'],
                scheduled_trans_status=data['scheduled_trans_status'],
                category=data.get('category'),
                scheduled_trans_details=data.get('scheduled_trans_details')
            )
            
            return Response({
                "success": True,
                "message": "Scheduled transaction updated successfully"
            }, status=status.HTTP_200_OK)
            
        except Http404:
            return Response(
                {"error": "Scheduled transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating scheduled transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating the scheduled transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ScheduledTransactionListApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        parameters=[ScheduledTransactionFilterSerializer],
        responses={200: ScheduledTransactionListResponseSerializer}
    )
    def get(self, request):
        """Get paginated scheduled transactions for the logged-in user."""
        try:
            filter_serializer = ScheduledTransactionFilterSerializer(data=request.query_params)
            filter_serializer.is_valid(raise_exception=True)
            filters = filter_serializer.validated_data
            
            # Get filtered scheduled transactions
            scheduled_trans_qs = get_scheduled_transactions_for_user(
                user=request.user,
                status_filter=filters.get('status')
            )
            
            # Paginate results
            paginator = Paginator(scheduled_trans_qs, 20)
            page_num = filters.get('page', 1)
            
            try:
                page_obj = paginator.page(page_num)
            except (PageNotAnInteger, EmptyPage):
                page_obj = paginator.page(1)
            
            # Serialize scheduled transactions
            scheduled_trans_list = [serialize_scheduled_trans(st) for st in page_obj.object_list]
            
            response_data = {
                "scheduled_transactions": scheduled_trans_list,
                "pagination": {
                    "page": page_obj.number,
                    "num_pages": paginator.num_pages,
                    "per_page": paginator.per_page,
                    "total": paginator.count,
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error getting scheduled transactions: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving scheduled transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ToggleScheduledTransactionStatusApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: 'Status toggled successfully',
            404: 'Scheduled transaction not found',
            500: 'Internal server error'
        }
    )
    def post(self, request, scheduled_trans_id):
        """Toggle the active status of a scheduled transaction."""
        try:
            scheduled_trans = toggle_scheduled_transaction_status(
                user=request.user,
                scheduled_trans_id=scheduled_trans_id
            )
            
            return Response({
                "success": True,
                "message": "Status updated successfully",
                "status": scheduled_trans.status
            }, status=status.HTTP_200_OK)
            
        except Http404:
            return Response(
                {"error": "Scheduled transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error toggling status: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class ApplyScheduledTransactionsApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: {
                'description': 'Scheduled transactions applied',
                'example': {
                    'success': True,
                    'applied_count': 3,
                    'errors': []
                }
            },
            500: 'Internal server error'
        },
        description='Apply scheduled transactions for the user; idempotent once per day.'
    )
    def post(self, request):
        """
        Trigger processing of scheduled transactions for the authenticated user.
        Safe to call once per day from the frontend; the function will skip already-processed items.
        """
        try:
            result = apply_scheduled_transactions(user=request.user)
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({
                "success": False,
                "applied_count": 0,
                "errors": [str(e)]
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected server error: {str(e)}")
            return Response({
                "success": False,
                "applied_count": 0,
                "errors": ["Unexpected server error"],
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

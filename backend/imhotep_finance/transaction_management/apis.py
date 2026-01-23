from rest_framework.permissions import IsAuthenticated
from transaction_management.services import create_transaction, delete_transaction, update_transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from .serializers import (
    TransactionInputSerializer, 
    TransactionDeleteResponseSerializer,
    TransactionUpdateSerializer,
    TransactionUpdateResponseSerializer,
    TransactionFilterSerializer,
    TransactionListResponseSerializer
)
from transaction_management.selectors import get_transactions_for_user
from finance_management.utils.serializer import serialize_transaction
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import HttpResponse
import csv
from finance_management.utils.get_networth import get_networth

class TransactionCreateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(request=TransactionInputSerializer)
    def post(self, request):
        serializer = TransactionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Create the transaction
            data = serializer.validated_data
            
            transaction = create_transaction(
                user=request.user,
                request=request,
                amount=data['amount'],
                currency=data['currency'],
                trans_status=data['trans_status'],
                category=data.get('category'),
                trans_details=data.get('trans_details'),
                transaction_date=data.get('date_param')
            )
            return Response(
                {"message": "Transaction created successfully", "id": transaction.id},
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while creating the transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TransactionDeleteApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={
            200: TransactionDeleteResponseSerializer,
            400: 'Bad request - Cannot delete transaction',
            404: 'Transaction not found',
            500: 'Internal server error',
        }
    )
    def delete(self, request, transaction_id):
        try:
            # Delete the transaction
            delete_transaction(
                user=request.user,
                transaction_id=transaction_id,
                request=request
            )
            
            # Get updated networth
            try:
                networth = get_networth(request)
            except Exception as e:
                print(f"Error getting networth: {str(e)}")
                networth = 0.0
            
            return Response({
                "success": True,
                "message": "Transaction deleted successfully",
                "networth": networth
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error deleting transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while deleting the transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TransactionUpdateApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=TransactionUpdateSerializer,
        responses={
            200: TransactionUpdateResponseSerializer,
            400: 'Bad request - Validation error',
            404: 'Transaction not found',
            500: 'Internal server error',
        }
    )
    def post(self, request, transaction_id):
        serializer = TransactionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            data = serializer.validated_data
            
            # Update the transaction
            update_transaction(
                user=request.user,
                transaction_id=transaction_id,
                amount=data['amount'],
                currency=data['currency'],
                trans_status=data['trans_status'],
                category=data.get('category'),
                trans_details=data.get('trans_details'),
                transaction_date=data['date']
            )
            
            # Get updated networth
            try:
                networth = get_networth(request)
            except Exception as e:
                print(f"Error getting networth: {str(e)}")
                networth = 0.0
            
            return Response({
                "success": True,
                "networth": networth
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating transaction: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating the transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TransactionListApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        parameters=[TransactionFilterSerializer],
        responses={200: TransactionListResponseSerializer}
    )
    def get(self, request):
        """Return paginated transactions for the logged-in user, filtered by date range."""
        try:
            # Validate query parameters
            filter_serializer = TransactionFilterSerializer(data=request.query_params)
            filter_serializer.is_valid(raise_exception=True)
            filters = filter_serializer.validated_data
            
            # Get filtered transactions
            transactions_qs, start_date, end_date = get_transactions_for_user(
                user=request.user,
                start_date=filters.get('start_date'),
                end_date=filters.get('end_date'),
                category=filters.get('category'),
                trans_status=filters.get('trans_status'),
                details_search=filters.get('details_search')
            )
            
            # Paginate results
            paginator = Paginator(transactions_qs, 20)
            page_num = filters.get('page', 1)
            
            try:
                page_obj = paginator.page(page_num)
            except (PageNotAnInteger, EmptyPage):
                page_obj = paginator.page(1)
            
            # Serialize transactions
            trans_list = [serialize_transaction(t) for t in page_obj.object_list]
            
            response_data = {
                "transactions": trans_list,
                "pagination": {
                    "page": page_obj.number,
                    "num_pages": paginator.num_pages,
                    "per_page": paginator.per_page,
                    "total": paginator.count,
                },
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error getting transactions: {str(e)}")
            return Response(
                {'error': 'An error occurred while retrieving transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TransactionExportCSVApi(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        parameters=[TransactionFilterSerializer],
        responses={200: 'CSV file'}
    )
    def get(self, request):
        """Export transactions as a CSV file for the logged-in user."""
        try:
            # Validate query parameters
            filter_serializer = TransactionFilterSerializer(data=request.query_params)
            filter_serializer.is_valid(raise_exception=True)
            filters = filter_serializer.validated_data
            
            # Get filtered transactions
            transactions_qs, start_date, end_date = get_transactions_for_user(
                user=request.user,
                start_date=filters.get('start_date'),
                end_date=filters.get('end_date'),
                category=filters.get('category'),
                trans_status=filters.get('trans_status'),
                details_search=filters.get('details_search')
            )
            
            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="transactions_{start_date}_to_{end_date}.csv"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            # Write CSV data
            writer = csv.writer(response)
            writer.writerow(['date', 'amount', 'currency', 'trans_status', 'category', 'trans_details'])
            
            for transaction in transactions_qs:
                writer.writerow([
                    transaction.date,
                    transaction.amount,
                    transaction.currency,
                    transaction.trans_status,
                    transaction.category,
                    transaction.trans_details
                ])
            
            return response
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error exporting transactions: {str(e)}")
            return Response(
                {'error': 'An error occurred while exporting transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
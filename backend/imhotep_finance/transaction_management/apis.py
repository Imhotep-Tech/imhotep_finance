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
    TransactionUpdateResponseSerializer
)
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
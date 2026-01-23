from rest_framework.permissions import IsAuthenticated
from transaction_management.services import create_transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from .serializers import TransactionInputSerializer

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
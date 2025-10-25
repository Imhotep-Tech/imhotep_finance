from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from finance_management.utils.get_networth import get_networth
from rest_framework.response import Response
from scheduled_trans_management.models import ScheduledTransaction
from finance_management.utils.currencies import get_allowed_currencies
from drf_yasg.utils import swagger_auto_schema
from .schemas.scheduled_trans_schemas import add_scheduled_trans_request, simple_success_response

@swagger_auto_schema(
    method='post',
    operation_description='Update a scheduled transaction.',
    request_body=add_scheduled_trans_request,
    responses={
        200: simple_success_response,
        400: 'Validation error',
        404: 'Scheduled transaction not found',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_scheduled_transactions(request, scheduled_trans_id):
    """Handle update transactions for the logged-in user."""
    user = request.user

    date = request.data.get("day_of_month")
    amount = request.data.get("amount")
    currency = request.data.get("currency")
    scheduled_trans_details = request.data.get("scheduled_trans_details")
    category = request.data.get("category")

    if currency is None or amount is None:
        return Response(
            {'error': "You have to choose the currency and amount!"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    amount = float(amount)

    if currency not in get_allowed_currencies():
        return Response(
            {'error': "Currency code not supported"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount < 0:
        return Response(
            {'error': "Amount Should be a positive number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    scheduled_transaction = get_object_or_404(ScheduledTransaction, id=scheduled_trans_id, user=user)

    # Update transaction in database
    try:
        scheduled_transaction.date = date
        scheduled_transaction.scheduled_trans_details = scheduled_trans_details
        scheduled_transaction.amount = amount
        scheduled_transaction.category = category
        scheduled_transaction.currency = currency
        scheduled_transaction.save()
    except Exception:
        return Response(
            {'error': f'Error happened while saving'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
    }, status=status.HTTP_200_OK)

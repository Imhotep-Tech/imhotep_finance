from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from user_reports.user_reports.utils.save_user_report import save_user_report_with_transaction_update
from finance_management.utils.get_networth import get_networth
from rest_framework.response import Response
from transaction_management.models import Transactions, NetWorth
from finance_management.utils.currencies import get_allowed_currencies
from drf_yasg.utils import swagger_auto_schema
from .schemas.transaction_schemas import update_transaction_request, update_transaction_response

@swagger_auto_schema(
    method='post',
    operation_description='Update an existing transaction and recalculate networth and reports accordingly.',
    request_body=update_transaction_request,
    responses={
        200: update_transaction_response,
        400: 'Validation error',
        404: 'Transaction not found',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_transactions(request, trans_id):
    """Handle update transactions for the logged-in user."""
    user = request.user

    date = request.data.get("date")
    amount = float(request.data.get("amount"))
    currency = request.data.get("currency")
    trans_details = request.data.get("trans_details")
    category = request.data.get("category")
    trans_status = request.data.get("trans_status")

    if currency is None or amount is None:
        return Response(
            {'error': "You have to choose the currency and amount!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if currency not in get_allowed_currencies():
        return Response(
            {'error': "Currency code not supported"},
            status=status.HTTP_400_BAD_REQUEST
        )

    available_status = [
        "Deposit",
        "Withdraw",
        "deposit",
        "withdraw"
    ]

    if trans_status not in available_status:
        return Response(
            {'error': "Transaction status must be either Deposit or Withdraw"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount < 0:
        return Response(
            {'error': "Amount Should be a positive number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    transaction = get_object_or_404(Transactions, id=trans_id, user=user)

    # Create a proper old transaction copy before modifying the original
    class OldTransactionCopy:
        def __init__(self, original_transaction):
            self.date = original_transaction.date
            self.amount = float(original_transaction.amount)
            self.currency = original_transaction.currency
            self.trans_status = original_transaction.trans_status
            self.category = original_transaction.category
            self.trans_details = original_transaction.trans_details
            self.user = original_transaction.user
            self.id = original_transaction.id

    old_transaction_copy = OldTransactionCopy(transaction)
    
    old_amount = float(transaction.amount)
    old_status = transaction.trans_status
    old_currency = transaction.currency

    # Get networth for the currency
    netWorth = get_object_or_404(NetWorth, user=user, currency=currency)
    old_total = float(netWorth.total)

    # Reverse old transaction effect
    if old_status.lower() == "withdraw":
        old_total += old_amount
    elif old_status.lower() == "deposit":
        old_total -= old_amount

    # Apply new transaction effect
    if trans_status.lower() == "withdraw":
        new_total = old_total - amount
    elif trans_status.lower() == "deposit":
        new_total = old_total + amount
    else:
        return Response(
            {'error': "Invalid transaction status."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_total < 0:
        return Response(
            {'error': "Insufficient balance for this withdrawal"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update transaction in database
    try:
        transaction.date = date
        transaction.trans_details = trans_details
        transaction.amount = amount
        transaction.category = category
        transaction.currency = currency
        transaction.trans_status = trans_status
        transaction.save()
    except Exception:
        return Response(
            {'error': f'Error happened while saving'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Update netWorth
    try:
        netWorth.total = new_total
        netWorth.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while updating netWorth'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Update the reports using the proper old transaction copy
    try:
        success, error = save_user_report_with_transaction_update(
            request, user, old_transaction_copy, transaction
        )
        
        if not success:
            print(f"Warning: Transaction updated but report update failed: {error}")
    except Exception as e:
        print(f"Report update error: {str(e)}")  # Log detailed error for debugging

    return Response({
        "success": True,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

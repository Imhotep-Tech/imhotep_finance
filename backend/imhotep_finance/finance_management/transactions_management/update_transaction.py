from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Transactions, NetWorth
from ..utils.currencies import get_allowed_currencies

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
            {'error': "Transaction Status Must Be Deposit Or Withdraw"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if amount < 0:
        return Response(
            {'error': "Amount Should be a positive number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    transaction = get_object_or_404(Transactions, id=trans_id, user=user)
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
            {'error': "You don't have enough money from this currency!"},
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
    except Exception as e:
        return Response(
            {'error': f'Error happened while saving: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Update netWorth
    try:
        netWorth.total = new_total
        netWorth.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while updating netWorth: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

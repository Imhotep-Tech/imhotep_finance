from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import ScheduledTransaction
from datetime import datetime
from ..utils.currencies import get_allowed_currencies

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_scheduled_transactions(request):
    """Handle scheduled transaction adding for the logged-in user."""
    try:
        user = request.user

        day_of_month = request.data.get("day_of_month")
        amount = request.data.get("amount")
        currency = request.data.get("currency")
        scheduled_trans_details = request.data.get("scheduled_trans_details")
        category = request.data.get("category")
        scheduled_trans_status = request.data.get("scheduled_trans_status")

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

        available_status = [
            "Deposit",
            "Withdraw",
            "deposit",
            "withdraw"
        ]

        if scheduled_trans_status not in available_status:
            return Response(
                {'error': "Transaction Status Must Be Deposit Or Withdraw"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount <= 0:
            return Response(
                {'error': "Amount Should be a positive number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_scheduled_transaction = ScheduledTransaction.objects.create(
                user=user,
                date=day_of_month,
                amount=amount,
                currency=currency,
                scheduled_trans_status=scheduled_trans_status,
                category=category,
                scheduled_trans_details=scheduled_trans_details
            )
            user_scheduled_transaction.save()
        except Exception:
            return Response(
                {'error': f'Failed to save transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "success": True,
        }, status=status.HTTP_200_OK)

    except Exception:
        return Response(
            {'error': f'Error Happened'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

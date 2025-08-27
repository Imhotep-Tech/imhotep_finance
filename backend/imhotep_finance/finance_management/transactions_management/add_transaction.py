from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Transactions, NetWorth
from datetime import datetime
from ..utils.currencies import get_allowed_currencies

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_transactions(request):
    """Handle deposit and withdraw transactions for the logged-in user."""
    try:
        user = request.user

        date = request.data.get("date")
        amount = request.data.get("amount")
        currency = request.data.get("currency")
        trans_details = request.data.get("trans_details")
        category = request.data.get("category")
        trans_status = request.data.get("trans_status")

        if currency is None or amount is None:
            return Response(
                {'error': "You have to choose the currency and amount!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        amount = float(amount)

        # If date is not provided, use current date
        if not date:
            date = datetime.now().date()

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

        if amount <= 0:
            return Response(
                {'error': "Amount Should be a positive number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_netWorth = NetWorth.objects.filter(user=user, currency=currency)

        if trans_status.lower() == "withdraw":
            total = float(old_netWorth.first().total) if old_netWorth.exists() else 0
            if (total - amount) < 0:
                return Response(
                    {'error': "You don't have enough of this currency"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            user_transaction = Transactions.objects.create(
                user=user,
                date=date,
                amount=amount,
                currency=currency,
                trans_status=trans_status,
                category=category,
                trans_details=trans_details
            )
            user_transaction.save()
        except Exception as e:
            return Response(
                {'error': f'Failed to save transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if old_netWorth.exists():
            total = float(old_netWorth.first().total)
            if trans_status.lower() == "deposit":
                new_total_calc = total + amount
            else:
                new_total_calc = total - amount
            old_netWorth.update(total=new_total_calc)
        else:
            new_netWorth = NetWorth.objects.create(
                user=user,
                total=amount,
                currency=currency
            )
            new_netWorth.save()

        return Response({
            "success": True,
            "networth": get_networth(request)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'Error Happened: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


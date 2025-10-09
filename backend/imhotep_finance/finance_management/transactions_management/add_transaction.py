from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Transactions, NetWorth
from datetime import datetime
from .utils.create_transaction import create_transaction

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

        # Call the utility function to create the transaction and update networth
        trans, error = create_transaction(request, user, date, amount, currency, trans_details, category, trans_status)

        if error:
            return Response(
                {'error': error["message"]},
                status=error["status"]
            )
        
        if trans:
            try:
                networth = get_networth(request)
            except Exception as e:
                print(f"Error getting networth: {str(e)}")
                networth = 0.0
                
            return Response({
                "success": True,
                "networth": networth
            }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error in add_transactions: {str(e)}")  # Log detailed error for debugging
        return Response(
            {'error': 'An error occurred while processing the transaction'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


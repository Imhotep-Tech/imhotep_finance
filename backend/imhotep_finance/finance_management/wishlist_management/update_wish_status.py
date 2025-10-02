from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from ..utils.currencies import select_currencies
from rest_framework.response import Response
from ..models import Transactions, NetWorth, Wishlist
from datetime import date
from ..transactions_management.utils.create_transaction import create_transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_wish_status(request, wish_id):
    """Handle update of the wish status for the logged-in user."""
    user = request.user

    wish = get_object_or_404(Wishlist, id=wish_id, user=user)

    currency = wish.currency #get currency
    amount = wish.price #get amount
    wish_status = wish.status #get current status
    wish_details = wish.wish_details #get wish details
    current_date = date.today() #get current date

    if not wish_status:
        # Call the utility function to create the transaction and update networth
        trans, error = create_transaction(user, current_date, amount, currency, wish_details, "Wishes", "Withdraw")
        if error:
            return Response(
                {'error': error["message"]},
                status=error["status"]
            )
        if trans:
            try:
                wish.transaction = trans
                wish.save()
            except Exception:
                return Response(
                        {'error': f'Error happened while creating the transaction'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    else:
        netWorth = NetWorth.objects.filter(user=user, currency=currency).first()
        user_balance = netWorth.total if netWorth else 0
        new_total = float(user_balance) + float(amount)

        # Update wish in database
        try:
            trans_wish = wish.transaction
            if trans_wish:
                trans_wish.delete()
                wish.transaction = None
        except Exception:
            return Response(
                    {'error': f'Error happened while Deleting the transaction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            netWorth.total = new_total
            netWorth.save()
        except Exception:
            return Response(
                {'error': f'Error happened while updating netWorth'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    new_status = not wish_status #set status to done
    try:
        wish.status = new_status
        wish.save()
    except Exception:
        return Response(
                {'error': f'Error happened while updating wish'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response({
        "success": True,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Transactions, NetWorth, Wishlist
from datetime import datetime

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_transaction(request, trans_id):
    """Delete a transaction and update networth."""
    user = request.user
    #get transaction data for deletion
    trans_db = get_object_or_404(Transactions, user=user, id=trans_id)

    old_amount =  trans_db.amount
    old_currency = trans_db.currency
    old_trans_status = trans_db.trans_status

    netWorth = get_object_or_404(NetWorth, user=user, currency=old_currency)
    old_total = float(netWorth.total)

    if old_trans_status.lower() == "deposit":
        new_total = old_total - float(old_amount)
        if new_total < 0:
            return Response(
                {'error': "You can't delete this transaction" },
                status=status.HTTP_400_BAD_REQUEST
            )
    elif old_trans_status.lower() == "withdraw":
        new_total = old_total + float(old_amount)
    else:
        return Response(
            {'error': "Invalid transaction status."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Only update wish if it exists for this transaction
    try:
        wish = Wishlist.objects.filter(transaction=trans_db, user=user).first()
        if wish:
            wish.status = False
            wish.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while updating wish: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    try:
        trans_db.delete()
    except Exception as e:
        return Response(
            {'error': f'Error happened while deleting: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    #update netWorth in database
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

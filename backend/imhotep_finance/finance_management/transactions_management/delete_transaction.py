from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Transactions, NetWorth, Wishlist
from ..user_reports.utils.save_user_report import save_user_report_with_transaction
from ..utils.get_networth import get_networth
from datetime import datetime
from drf_yasg.utils import swagger_auto_schema
from .schemas.transaction_schemas import delete_transaction_response

@swagger_auto_schema(
    method='delete',
    operation_description='Delete a transaction and update balances and reports.',
    responses={
        200: delete_transaction_response,
        400: 'Bad request',
        404: 'Transaction not found',
        500: 'Internal server error',
    }
)
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
    except Exception:
        return Response(
            {'error': f'Error happened while updating wish'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    # Update the report before deleting the transaction
    success, error = save_user_report_with_transaction(
        request, user, trans_db.date, trans_db, parent_function="delete_transaction"
    )
    
    # Delete the transaction
    try:
        trans_db.delete()
    except Exception as e:
        return Response(
            {'error': f'Error happened while deleting'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    #update netWorth in database
    try:
        netWorth.total = new_total
        netWorth.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while updating netWorth'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    if not success:
        return Response(
            {'message': 'Transaction deleted but report update failed', 'error': error},
            status=status.HTTP_200_OK
        )
    
    try:
        networth = get_networth(request)
    except Exception as e:
        print(f"Error getting networth: {str(e)}")  # Log detailed error for debugging
        networth = 0.0
    
    return Response({
        "success": True,
        "networth": networth
    }, status=status.HTTP_200_OK)

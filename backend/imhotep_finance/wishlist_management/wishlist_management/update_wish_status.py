from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from finance_management.utils.get_networth import get_networth
from finance_management.utils.currencies import select_currencies
from rest_framework.response import Response
from transaction_management.models import Transactions, NetWorth
from wishlist_management.models import Wishlist
from datetime import date
from transaction_management.services import create_transaction
from user_reports.user_reports.utils.save_user_report import save_user_report_with_transaction
from drf_yasg.utils import swagger_auto_schema
from .schemas.wishlist_schemas import update_wish_status_response

@swagger_auto_schema(
    method='post',
    operation_description='Toggle a wishlist item purchased status and reflect on transactions/networth.',
    responses={
        200: update_wish_status_response,
        404: 'Wishlist item not found',
        500: 'Internal server error',
    }
)
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
        trans, error = create_transaction(request, user, current_date, amount, currency, wish_details, "Wishes", "Withdraw")
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
                        {'error': 'Error occurred while creating the transaction'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    else:
        # Wish is being marked as not purchased - reverse the transaction
        netWorth = NetWorth.objects.filter(user=user, currency=currency).first()
        user_balance = netWorth.total if netWorth else 0
        new_total = float(user_balance) + float(amount)

        # Update reports before deleting the transaction
        try:
            trans_wish = wish.transaction
            if trans_wish:
                # Update the report to remove this transaction
                success, error = save_user_report_with_transaction(
                    user, trans_wish.date, trans_wish, parent_function="delete_transaction"
                )
                if not success:
                    print(f"Warning: Failed to update report when reversing wish transaction: {error}")
                
                # Delete the transaction
                trans_wish.delete()
                wish.transaction = None
        except Exception as e:
            print(f"Error deleting wish transaction: {str(e)}")  # Log detailed error for debugging
            return Response(
                    {'error': 'Error occurred while processing the transaction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update networth
        try:
            if netWorth:
                netWorth.total = new_total
                netWorth.save()
            else:
                # Create networth entry if it doesn't exist
                NetWorth.objects.create(user=user, total=new_total, currency=currency)
        except Exception as e:
            print(f"Error updating networth in wish status: {str(e)}")  # Log detailed error for debugging
            return Response(
                {'error': 'Error occurred while updating balance'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    new_status = not wish_status #set status to done
    try:
        wish.status = new_status
        wish.save()
    except Exception as e:
        print(f"Error updating wish status: {str(e)}")  # Log detailed error for debugging
        return Response(
                {'error': 'Error occurred while updating wish'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response({
        "success": True,
        "message": f"Wish {'purchased' if new_status else 'marked as pending'}",
        "wish_status": new_status,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

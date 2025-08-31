from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from ..utils.currencies import select_currencies
from rest_framework.response import Response
from ..models import Transactions, NetWorth, Wishlist
from ..utils.currencies import get_allowed_currencies
from datetime import date

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_wish_status(request, wish_id):
    """Handle update of the wish status for the logged-in user."""
    user = request.user

    wish = get_object_or_404(Wishlist, id=wish_id, user=user)

    currency = wish.currency #get currency
    amount = wish.price #get amount
    wish_status = wish.status #get current status
    link = wish.link #get link
    wish_details = wish.wish_details #get wish details
    year = wish.year #get year
    current_date = date.today() #get current date
    
    if amount < 0:
        return Response(
            {'error': "Amount Should be a positive number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if currency not in select_currencies(user):
        return Response(
            {'error': "You don't have on your balance enough of this currency!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    netWorth = get_object_or_404(NetWorth, user=user, currency=currency)

    user_balance = float(netWorth.total)

    if user_balance < float(amount) and not wish_status:
        return Response(
            {'error': "You don't have on your balance enough of this currency!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not wish_status: #marking wish as done
        new_total = float(user_balance) - float(amount) #subtract amount from balance

        new_transaction = Transactions.objects.create(
            user=user,
            currency=currency,
            amount=amount,
            trans_details=wish_details,
            trans_status='Withdraw',
            category='Wishes',
            date=current_date
        )
        new_transaction.save()

        wish.transaction = new_transaction
        wish.save()
    else:
        new_total = float(user_balance) + float(amount)

        # Update wish in database
        try:
            trans_wish = wish.transaction
            if trans_wish:
                trans_wish.delete()
                wish.transaction = None
        except Exception as e:
            return Response(
                {'error': f'Error happened while Deleting the transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    new_status = not wish_status #set status to done

    try:
        netWorth.total = new_total
        netWorth.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while updating netWorth: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    try:
        wish.status = new_status
        wish.save()
    except Exception as e:
        return Response(
                {'error': f'Error happened while updating wish: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response({
        "success": True,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

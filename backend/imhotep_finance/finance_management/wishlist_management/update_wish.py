from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Wishlist
from ..utils.currencies import get_allowed_currencies

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_wish(request, wish_id):
    """Handle update wish for the logged-in user."""
    user = request.user

    year = request.data.get("year")
    price = request.data.get("price")
    currency = request.data.get("currency")
    wish_details = request.data.get("wish_details")
    link = request.data.get("link")

    if currency is None or price is None:
        return Response(
            {'error': "You have to choose the currency and amount!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if currency not in get_allowed_currencies():
        return Response(
            {'error': "Currency code not supported"},
            status=status.HTTP_400_BAD_REQUEST
        )

    wish = get_object_or_404(Wishlist, user=user, id=wish_id)

    if wish.status:
        return Response(
            {'error': "Wish Status Must Be pending to update it"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if price < 0:
        return Response(
            {'error': "Amount Should be a positive number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    price = float(price)

    # Update wish in database
    try:
        wish.year = year
        wish.price=price
        wish.currency=currency
        wish.wish_details=wish_details
        wish.link=link
        wish.save()
    except Exception as e:
        return Response(
            {'error': f'Error happened while saving: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
    }, status=status.HTTP_200_OK)


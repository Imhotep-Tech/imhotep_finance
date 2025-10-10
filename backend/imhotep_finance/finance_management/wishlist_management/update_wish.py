from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Wishlist
from ..utils.currencies import get_allowed_currencies
from drf_yasg.utils import swagger_auto_schema
from .schemas.wishlist_schemas import update_wish_request, simple_success_response

@swagger_auto_schema(
    method='post',
    operation_description='Update a wishlist item.',
    request_body=update_wish_request,
    responses={
        200: simple_success_response,
        400: 'Validation error',
        404: 'Wishlist item not found',
        500: 'Internal server error',
    }
)
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

    price = float(price)
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
    except Exception:
        return Response(
            {'error': f'Error happened while saving'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
    }, status=status.HTTP_200_OK)


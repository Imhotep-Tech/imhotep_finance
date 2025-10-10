from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Wishlist
from ..utils.currencies import get_allowed_currencies
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from .schemas.wishlist_schemas import add_wish_request, simple_success_response

@swagger_auto_schema(
    method='post',
    operation_description='Create a wishlist item for the authenticated user.',
    request_body=add_wish_request,
    responses={
        200: simple_success_response,
        400: 'Validation error',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_wish(request):
    """Handle a wishlist item for the logged-in user."""
    try:
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

        # If date is not provided, use current date
        if not year:
            year = timezone.now().year

        if currency not in get_allowed_currencies():
            return Response(
                {'error': "Currency code not supported"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if price < 0:
            return Response(
                {'error': "Amount Should be a positive number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_wish = Wishlist.objects.create(
                user=user,
                price=price,
                currency=currency,
                year=year,
                wish_details=wish_details,
                link=link,
            )
            user_wish.save()
        except Exception:
            return Response(
                {'error': f'Failed to save wish'},
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
    
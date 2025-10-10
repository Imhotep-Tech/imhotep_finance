from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from rest_framework.response import Response
from ..models import Wishlist
from datetime import datetime
from drf_yasg.utils import swagger_auto_schema
from .schemas.wishlist_schemas import simple_success_response

@swagger_auto_schema(
    method='delete',
    operation_description='Delete a pending wishlist item.',
    responses={
        200: simple_success_response,
        404: 'Wishlist item not found',
        400: 'Cannot delete purchased wish',
        500: 'Internal server error',
    }
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_wish(request, wish_id):
    """Delete a wish."""
    user = request.user

    #get wish data for deletion
    wish_db = get_object_or_404(Wishlist, user=user, id=wish_id)

    wish_status = wish_db.status  # renamed to avoid shadowing

    if wish_status:
        return Response(
            {'error': "You must select a pending wish to delete it"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        wish_db.delete()
    except Exception:
        return Response(
            {'error': f'Error happened while deleting'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
        "networth": get_networth(request)
    }, status=status.HTTP_200_OK)

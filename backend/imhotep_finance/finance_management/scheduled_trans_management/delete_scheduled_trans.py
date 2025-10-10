from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import ScheduledTransaction
from drf_yasg.utils import swagger_auto_schema
from .schemas.scheduled_trans_schemas import simple_success_response

@swagger_auto_schema(
    method='delete',
    operation_description='Delete a scheduled transaction.',
    responses={
        200: simple_success_response,
        404: 'Scheduled transaction not found',
        500: 'Internal server error',
    }
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_scheduled_trans(request, scheduled_trans_id):
    """Delete a scheduled transaction"""
    user = request.user
    # get the scheduled transaction instance (use ScheduledTransaction model)
    scheduled_trans = get_object_or_404(ScheduledTransaction, user=user, id=scheduled_trans_id)

    try:
        scheduled_trans.delete()
    except Exception:
        return Response(
            {'error': f'Error happened while deleting'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "success": True,
    }, status=status.HTTP_200_OK)

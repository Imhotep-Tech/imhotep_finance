from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from finance_management.utils.get_networth import get_networth
from finance_management.utils.currencies import select_currencies
from rest_framework.response import Response
from scheduled_trans_management.models import ScheduledTransaction
from finance_management.utils.currencies import get_allowed_currencies
from datetime import date
from drf_yasg.utils import swagger_auto_schema
from .schemas.scheduled_trans_schemas import simple_success_response

@swagger_auto_schema(
    method='post',
    operation_description='Toggle scheduled transaction active status.',
    responses={
        200: simple_success_response,
        404: 'Scheduled transaction not found',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_scheduled_trans_status(request, scheduled_trans_id):
    """Handle update of the wish status for the logged-in user."""
    user = request.user

    scheduled_trans = get_object_or_404(ScheduledTransaction, id=scheduled_trans_id, user=user)

    new_status = not scheduled_trans.status

    try:
        scheduled_trans.status = new_status
        scheduled_trans.save()
    except Exception:
        return Response(
            {'error': f'Error happened while updating netWorth'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        "success": True,
    }, status=status.HTTP_200_OK)

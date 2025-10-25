from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from target_management.models import Target
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from .schemas.target_schemas import get_target_response

@swagger_auto_schema(
    method='get',
    operation_description='Get latest target for authenticated user.',
    responses={
        200: get_target_response,
        404: 'Target not found',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_target(request):
    """
    Get current authenticated user's target if found else return 404
    """
    user = request.user
    target_qs = Target.objects.filter(user=user).order_by('-created_at').first()
    if not target_qs:
        return Response(
            {'error': 'Target not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response({
        'id': user.id,
        'target':target_qs.target,
        'month': target_qs.month,
        'year': target_qs.year,
        'score': target_qs.score,
    })

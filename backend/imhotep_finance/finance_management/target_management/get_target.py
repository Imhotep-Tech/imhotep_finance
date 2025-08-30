from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Target

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_target(request):
    """
    Get current authenticated user's target if found else return 404
    """
    user = request.user
    target_qs = get_object_or_404(
        Target.objects.filter(user=user).order_by('-created_at')
    )
    return Response({
        'id': user.id,
        'target':target_qs.target,
        'month': target_qs.month,
        'year': target_qs.year,
        'score': target_qs.score,
    })

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.serializer import serialize_target
from rest_framework.response import Response
from ..models import Target
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_score_history(request):
    """Return paginated scores history for the logged-in user, sorted by date."""
    
    target_qs = Target.objects.filter(user=request.user).order_by('-created_at')
    
    paginator = Paginator(target_qs, 20)
    page_num = request.GET.get('page', 1)
    try:
        page_obj = paginator.page(page_num)
    except (PageNotAnInteger, EmptyPage):
        page_obj = paginator.page(1)

    target_list = [serialize_target(t) for t in page_obj.object_list]

    response_data = {
        "targets": target_list,
        "pagination": {
            "page": page_obj.number,
            "num_pages": paginator.num_pages,
            "per_page": paginator.per_page,
            "total": paginator.count,
        }
    }
    return Response(response_data, status=status.HTTP_200_OK)

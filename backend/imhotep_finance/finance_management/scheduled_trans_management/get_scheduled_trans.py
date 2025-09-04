from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.serializer import serialize_scheduled_trans
from rest_framework.response import Response
from ..models import ScheduledTransaction
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scheduled_transaction(request):
    """Return paginated scheduled transactions for the logged-in user"""
    try:

        # Filter transactions by user and date range
        user_scheduled_tans_qs = ScheduledTransaction.objects.filter(
            user=request.user,
        ).order_by('-date').all()

        paginator = Paginator(user_scheduled_tans_qs, 20)
        page_num = request.GET.get('page', 1)
        try:
            page_obj = paginator.page(page_num)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)

        scheduled_trans_list = [serialize_scheduled_trans(t) for t in page_obj.object_list]

        response_data = {
            "scheduled_transactions": scheduled_trans_list,
            "pagination": {
                "page": page_obj.number,
                "num_pages": paginator.num_pages,
                "per_page": paginator.per_page,
                "total": paginator.count,
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception:
        return Response(
            {'error': f'Error Happened'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

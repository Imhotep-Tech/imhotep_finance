from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from finance_management.utils.serializer import serialize_wishlist
from rest_framework.response import Response
from wishlist_management.models import Wishlist
from datetime import date
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import calendar
from drf_yasg.utils import swagger_auto_schema
from .schemas.wishlist_schemas import get_wishlist_params, get_wishlist_response

@swagger_auto_schema(
    method='get',
    manual_parameters=get_wishlist_params,
    operation_description='Get paginated wishlist by year (default current year).',
    responses={
        200: get_wishlist_response,
        400: 'Invalid query params',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    """Return paginated transactions for the logged-in user, filtered by date range."""
    try:
        year = request.query_params.get('year')
       
        if year is None: #check if no year provided
            today = date.today() #get current date
            year = today.year #use current year

        # Filter transactions by user and date range
        user_wish_qs = Wishlist.objects.filter(
            user=request.user,
            year=year
        ).order_by('-created_at').all()

        paginator = Paginator(
        user_wish_qs, 20)
        page_num = request.GET.get('page', 1)
        try:
            page_obj = paginator.page(page_num)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)

        wishlist = [serialize_wishlist(w) for w in page_obj.object_list]

        response_data = {
            "wishlist": wishlist,
            "pagination": {
                "page": page_obj.number,
                "num_pages": paginator.num_pages,
                "per_page": paginator.per_page,
                "total": paginator.count,
            },
            "year": year
        }
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception:
        return Response(
            {'error': f'Error Happened'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

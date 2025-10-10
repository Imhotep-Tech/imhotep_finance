from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..utils.get_networth import get_networth
from ..utils.serializer import serialize_transaction
from rest_framework.response import Response
from ..models import Transactions, NetWorth
from datetime import datetime, date
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import calendar
from drf_yasg.utils import swagger_auto_schema
from .schemas.transaction_schemas import get_transactions_params, get_transactions_response

@swagger_auto_schema(
    method='get',
    manual_parameters=get_transactions_params,
    operation_description='List user transactions with pagination and optional date range filter.',
    responses={
        200: get_transactions_response,
        400: 'Invalid query params',
        500: 'Internal server error',
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction(request):
    """Return paginated transactions for the logged-in user, filtered by date range."""
    try:
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
       
        today = date.today()
        if not start_date:
            start_date = today.replace(day=1)
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if not end_date:
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = today.replace(day=last_day)
        else:
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Filter transactions by user and date range
        user_tans_qs = Transactions.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('-date').all()

        paginator = Paginator(user_tans_qs, 20)
        page_num = request.GET.get('page', 1)
        try:
            page_obj = paginator.page(page_num)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)

        trans_list = [serialize_transaction(t) for t in page_obj.object_list]

        response_data = {
            "transactions": trans_list,
            "pagination": {
                "page": page_obj.number,
                "num_pages": paginator.num_pages,
                "per_page": paginator.per_page,
                "total": paginator.count,
            },
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception:
        return Response(
            {'error': f'Error Happened'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
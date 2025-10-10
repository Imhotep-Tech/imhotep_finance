from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..utils.get_networth import get_networth
from ..models import Transactions, NetWorth
from .utils.create_transaction import create_transaction
from drf_yasg.utils import swagger_auto_schema
from .schemas.transaction_schemas import add_transaction_request, add_transaction_response

@swagger_auto_schema(
    method="post",
    operation_description="Handle deposit and withdrawal transactions for the logged-in user.",
    request_body=add_transaction_request,
    responses={
        200: add_transaction_response,
        400: "Invalid input data",
        500: "Internal server error"
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_transactions(request):
    try:
        user = request.user
        date = request.data.get("date")
        amount = request.data.get("amount")
        currency = request.data.get("currency")
        trans_details = request.data.get("trans_details")
        category = request.data.get("category")
        trans_status = request.data.get("trans_status")

        # Create the transaction
        trans, error = create_transaction(
            request, user, date, amount, currency, trans_details, category, trans_status
        )

        if error:
            return Response({'error': error["message"]}, status=error["status"])

        if trans:
            try:
                networth = get_networth(request)
            except Exception as e:
                print(f"Error getting networth: {str(e)}")
                networth = 0.0

            return Response({
                "success": True,
                "networth": networth
            }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error in add_transactions: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing the transaction'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

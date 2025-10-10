from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..utils.recalculate_networth import recalculate_networth
from ..utils.get_networth import get_networth
from ..models import Transactions, NetWorth
from drf_yasg.utils import swagger_auto_schema
from .schemas.transaction_schemas import recalculate_networth_response

@swagger_auto_schema(
    method='post',
    operation_description='Recalculate user networth from all transactions.',
    responses={
        200: recalculate_networth_response,
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_networth_endpoint(request):
    """Recalculate user's networth from all transactions."""
    try:
        user = request.user
        
        # Log initial state for debugging
        initial_transactions_count = Transactions.objects.filter(user=user).count()
        initial_networth_records = NetWorth.objects.filter(user=user).count()
        
        print(f"Starting recalculation for user {user.username}")
        print(f"Initial transactions: {initial_transactions_count}")
        print(f"Initial networth records: {initial_networth_records}")
        
        # Call the utility function to recalculate networth
        success, result = recalculate_networth(user)
        
        if not success:
            return Response(
                {'error': result},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Get the updated networth
        try:
            updated_networth = get_networth(request)
        except Exception as e:
            print(f"Error getting updated networth: {str(e)}")
            updated_networth = 0.0
        
        # Additional validation - check if recalculation makes sense
        final_networth_records = NetWorth.objects.filter(user=user).count()
        
        # Prepare detailed response
        response_data = {
            "success": True,
            "message": "Networth recalculated successfully",
            "details": {
                "currencies_processed": result["currencies_processed"],
                "networth_records_created": result["networth_records_created"],
                "currency_breakdown": result["currency_totals"],
                "validation": {
                    "total_transactions_processed": initial_transactions_count,
                    "initial_networth_records": initial_networth_records,
                    "final_networth_records": final_networth_records,
                    "currencies_with_transactions": list(result["currency_totals"].keys())
                }
            },
            "updated_networth": updated_networth
        }
        
        # Log success
        print(f"Recalculation completed successfully for user {user.username}")
        print(f"Currency totals: {result['currency_totals']}")
        print(f"Updated total networth: {updated_networth}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in recalculate_networth_endpoint: {str(e)}")
        return Response(
            {'error': 'An error occurred while recalculating networth'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

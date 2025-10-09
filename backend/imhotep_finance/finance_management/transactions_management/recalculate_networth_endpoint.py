from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..utils.recalculate_networth import recalculate_networth
from ..utils.get_networth import get_networth

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_networth_endpoint(request):
    """Recalculate user's networth from all transactions."""
    try:
        user = request.user
        
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
        
        return Response({
            "success": True,
            "message": "Networth recalculated successfully",
            "details": {
                "currencies_processed": result["currencies_processed"],
                "networth_records_created": result["networth_records_created"],
                "currency_breakdown": result["currency_totals"]
            },
            "updated_networth": updated_networth
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in recalculate_networth_endpoint: {str(e)}")
        return Response(
            {'error': 'An error occurred while recalculating networth'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from .schemas.scheduled_trans_schemas import apply_scheduled_trans_response

@swagger_auto_schema(
    method='post',
    operation_description='Apply scheduled transactions for the user; idempotent once per day.',
    responses={
        200: apply_scheduled_trans_response,
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_scheduled_trans(request):
    """
    Trigger processing of scheduled transactions for the authenticated user.
    Safe to call once per day from the frontend; the function will skip already-processed items.
    """
    user = request.user
    try:
        # import utils at call-time so tests can patch
        from . import utils as _utils

        result = _utils.apply_scheduled_transactions_fn(user)
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception:
        # return exact error element expected by tests
        return Response(
            {
                "success": False,
                "applied_count": 0,
                "errors": ["Unexpected server error"],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
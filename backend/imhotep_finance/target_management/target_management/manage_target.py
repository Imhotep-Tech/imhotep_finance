from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from target_management.models import Target
from datetime import datetime
from drf_yasg.utils import swagger_auto_schema
from .schemas.target_schemas import manage_target_request, simple_success_response

@swagger_auto_schema(
    method='post',
    operation_description='Create or update current month target.',
    request_body=manage_target_request,
    responses={
        200: simple_success_response,
        400: 'Validation error',
        500: 'Internal server error',
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_target(request):
    """Handle target adding or updating for the logged-in user."""
    try:
        user = request.user

        target = request.data.get("target")

        if not target:
            return Response(
                {'error': "Target is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target = int(target)  # ensure it's an integer
        except ValueError:
            return Response(
                {'error': "Target must be an integer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = datetime.now()
        current_month = now.month #get current month
        current_year = now.year #get current year

        try:
            #check if a target already exists for this month/year
            target_qs = Target.objects.filter(
                user=user, month=current_month, year=current_year
            ).first()

            if not target_qs:
                    Target.objects.create(
                        user=user,
                        target=target,
                        month=current_month,
                        year=current_year
                    )
            else:
                    target_qs.target = target
                    target_qs.save()

        except Exception:
            return Response(
                {'error': f'Failed to save target'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "success": True,
        }, status=status.HTTP_200_OK)

    except Exception:
        return Response(
            {'error': f'Error Happened'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from finance_management.utils.currencies import get_fav_currency, get_allowed_currencies
from drf_yasg.utils import swagger_auto_schema
from datetime import datetime
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
# from accounts.services import create_target_for_user, calculate_score
# from accounts.selectors
from accounts.serializers import (
    ChangeFavCurrencyRequestSerializer,
    UserViewResponseSerializer,
)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class UserViewApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserViewResponseSerializer},
        description="Get current authenticated user details."
    )
    def get(self, request):
        """Get current authenticated user details."""
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email_verify': getattr(user, 'email_verify', False),
        })

class ChangeFavCurrencyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangeFavCurrencyRequestSerializer,
        responses={200: 'Change favorite currency successful', 400: 'Validation error'},
        description="Change user favorite currency."
    )
    def post(self, request):
        """Change Users Favorite currency"""
        serializer = ChangeFavCurrencyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = request.user
            user.favorite_currency = serializer.validated_data['fav_currency']
            user.save()
        except Exception:
                return Response(
                    {'error': f'Failed to save transaction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response({
                "success": True
            }, status=status.HTTP_200_OK)


class GetFavCurrencyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: 'Get favorite currency successful'},
        description="Get user favorite currency."
    )
    def get(self, request):
        """Get current authenticated user favorite_currency"""
        user = request.user
        return Response({
            'id': user.id,
            'favorite_currency': get_fav_currency(user)
        })


class UpdateUserLastLoginApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: 'user last login updated successfully'},
        description="Update user last login time."
    )
    def post(self, request):
        """Update current authenticated user's last login time"""
        user = request.user
        user.last_login = datetime.now()
        user.save()
        return Response({
            'id': user.id,
            'last_login': user.last_login
        })


from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from finance_management.services import (
    get_user_networth_service,
    get_user_networth_details_service,
    get_user_categories_service
)
from finance_management.serializers import (
    NetworthResponseSerializer,
    NetworthDetailsResponseSerializer,
    CategoryRequestSerializer,
    CategoryResponseSerializer
)


class GetNetworthApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Get total networth for the authenticated user.",
        responses={200: NetworthResponseSerializer},
        operation_id='get_networth'
    )
    def get(self, request):
        """Get current authenticated user total netWorth"""
        user = request.user
        networth = get_user_networth_service(user)
        
        return Response({
            'id': user.id,
            'networth': networth,
        }, status=status.HTTP_200_OK)


class GetNetworthDetailsApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Get networth details per currency for the authenticated user.",
        responses={200: NetworthDetailsResponseSerializer},
        operation_id='get_networth_details'
    )
    def get(self, request):
        """Get current authenticated user netWorth details"""
        user = request.user
        networth_details = get_user_networth_details_service(user)
        
        return Response({
            'id': user.id,
            'networth_details': networth_details,
        }, status=status.HTTP_200_OK)


class GetCategoryApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Get user's most frequently used categories optionally filtered by status.",
        parameters=[CategoryRequestSerializer],
        responses={200: CategoryResponseSerializer},
        operation_id='get_categories'
    )
    def get(self, request):
        """Get current authenticated user's most frequently used categories.
        Optional query param: ?status=Deposit|Withdraw|ANY
        """
        user = request.user
        status_param = request.query_params.get('status', 'ANY')
        
        categories = get_user_categories_service(user, status_param)
        
        return Response({
            'id': user.id,
            'category': categories,
        }, status=status.HTTP_200_OK)

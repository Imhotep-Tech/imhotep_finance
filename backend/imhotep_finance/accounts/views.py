from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import User
from finance_management.utils.currencies import get_fav_currency, get_allowed_currencies
from drf_yasg.utils import swagger_auto_schema
from .schemas.profile_schemas import (
    user_view_response,
    change_fav_currency_request,
    change_fav_currency_response,
    get_fav_currency_response,
)

@swagger_auto_schema(
    method='get',
    operation_description='Get current authenticated user details.',
    responses={200: user_view_response}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
    """
    Get current authenticated user details
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email_verify': getattr(user, 'email_verify', False),
    })

@swagger_auto_schema(
    method='post',
    operation_description='Change user favorite currency.',
    request_body=change_fav_currency_request,
    responses={200: change_fav_currency_response, 400: 'Validation error'}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_favorite_currency(request):
    """
    Change Users Favorite currency
    """
    user = request.user
    fav_currency = request.data.get('fav_currency')

    if fav_currency not in get_allowed_currencies():
        return Response(
                {'error': "Currency code not supported"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    try:
        user.favorite_currency = fav_currency
        user.save()
    except Exception:
            return Response(
                {'error': f'Failed to save transaction'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response({
            "success": True
        }, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='get',
    operation_description='Get user favorite currency.',
    responses={200: get_fav_currency_response}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_favorite_currency(request):
    """
    Get current authenticated user favorite_currency
    """
    user = request.user
    return Response({
        'id': user.id,
        'favorite_currency': get_fav_currency(user)
    })

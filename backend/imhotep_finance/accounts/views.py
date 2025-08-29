from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import User
from finance_management.utils.currencies import get_fav_currency, get_allowed_currencies

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
    except Exception as e:
            return Response(
                {'error': f'Failed to save transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response({
            "success": True
        }, status=status.HTTP_200_OK)

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

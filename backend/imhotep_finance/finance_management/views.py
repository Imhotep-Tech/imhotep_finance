from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.models import User
from .utils.get_networth import get_networth, get_netWorth_details
from .utils.get_category import get_category

# Create your views here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_networth(request):
    """
    Get current authenticated user total netWorth
    """
    user = request.user
    return Response({
        'id': user.id,
        'networth': get_networth(request),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_netWorth_details(request):
    """
    Get current authenticated user netWorth details
    """
    user = request.user
    print(get_netWorth_details(request))
    return Response({
        'id': user.id,
        'networth_details': get_netWorth_details(request),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_category(request):
    """
    Get current authenticated user's most frequently used categories.
    Optional query param: ?status=Deposit|Withdraw|ANY
    """
    user = request.user
    status = request.query_params.get('status', 'ANY')
    return Response({
        'id': user.id,
        'category': get_category(user, status),
    })

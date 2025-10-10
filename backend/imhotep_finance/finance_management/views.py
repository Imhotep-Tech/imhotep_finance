from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.models import User
from .utils.get_networth import get_networth, get_netWorth_details
from .utils.get_category import get_category
from drf_yasg.utils import swagger_auto_schema
from .schemas.root_schemas import (
    get_networth_response,
    get_networth_details_response,
    get_category_params,
    get_category_response,
)

# Create your views here.
@swagger_auto_schema(
    method='get',
    operation_description='Get total networth for the authenticated user.',
    responses={
        200: get_networth_response,
    }
)
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

@swagger_auto_schema(
    method='get',
    operation_description='Get networth details per currency for the authenticated user.',
    responses={
        200: get_networth_details_response,
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_netWorth_details(request):
    """
    Get current authenticated user netWorth details
    """
    user = request.user
    return Response({
        'id': user.id,
        'networth_details': get_netWorth_details(request),
    })

@swagger_auto_schema(
    method='get',
    manual_parameters=get_category_params,
    operation_description="Get user's most frequently used categories optionally filtered by status.",
    responses={
        200: get_category_response,
    }
)
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

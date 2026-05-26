from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from transaction_management.services import create_transaction
from transaction_management.models import NetWorth
from datetime import date
from finance_management.utils.currencies import get_or_update_rates
from finance_management.services import (
    get_user_networth_service,
    get_user_networth_details_service,
    get_user_categories_service,
    get_user_places_service
)
from finance_management.serializers import (
    NetworthResponseSerializer,
    NetworthDetailsResponseSerializer,
    CategoryRequestSerializer,
    CategoryResponseSerializer,
    PlaceRequestSerializer,
    PlaceResponseSerializer,
    MoveMoneyRequestSerializer,
    ConvertCurrencyRequestSerializer
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

class GetPlacesApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Get user's most frequently used places optionally filtered by currency.",
        parameters=[PlaceRequestSerializer],
        responses={200: PlaceResponseSerializer},
        operation_id='get_places'
    )
    def get(self, request):
        """Get current authenticated user's most frequently used places.
        Optional query param: ?currency=ANY|<specific_currency>
        """
        user = request.user
        currency_param = request.query_params.get('currency', 'ANY')
        
        places = get_user_places_service(user, currency=currency_param)
        
        return Response({
            'id': user.id,
            'places': places,
        }, status=status.HTTP_200_OK)

class MoveMoneyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Move money between two places.",
        request=MoveMoneyRequestSerializer,
        responses={200: serializers.Serializer},
        operation_id='move_money'
    )
    def post(self, request):
        serializer = MoveMoneyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        source_place = serializer.validated_data['source_place'].strip().title()
        target_place = serializer.validated_data['target_place'].strip().title()
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data['currency']
        
        if amount <= 0:
            raise DRFValidationError("Amount must be greater than zero.")
            
        if source_place == target_place:
            raise DRFValidationError("Source and target places must be different.")
            
        # Check if the source place and currency combination is available
        source_networth = NetWorth.objects.filter(user=user, currency=currency, place=source_place).first()
        if not source_networth:
            raise DRFValidationError(f"Source place '{source_place}' with currency '{currency}' does not exist.")
            
        if source_networth.total < amount:
            raise DRFValidationError(f"Insufficient funds in '{source_place}'. Available: {source_networth.total} {currency}.")
            
        try:
            with transaction.atomic():
                # 1. Create withdraw transaction from source place
                withdraw_trans = create_transaction(
                    user=user,
                    amount=amount,
                    currency=currency,
                    trans_details=f"Transfer to {target_place}",
                    category="Transfer",
                    trans_status="Withdraw",
                    transaction_date=date.today(),
                    place=source_place
                )
                
                # 2. Create deposit transaction to target place
                deposit_trans = create_transaction(
                    user=user,
                    amount=amount,
                    currency=currency,
                    trans_details=f"Transfer from {source_place}",
                    category="Transfer",
                    trans_status="Deposit",
                    transaction_date=date.today(),
                    place=target_place
                )
        except DjangoValidationError as e:
            raise DRFValidationError(e.message)
        except Exception as e:
            raise DRFValidationError(str(e))
            
        return Response({"message": "Money moved successfully"}, status=status.HTTP_200_OK)

class GetExchangeRatesApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Get current exchange rates against USD.",
        responses={200: serializers.DictField()},
        operation_id='get_exchange_rates'
    )
    def get(self, request):
        rates = get_or_update_rates()
        if rates:
            return Response(rates, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch exchange rates."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConvertCurrencyApi(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Finance Management'],
        description="Convert currency within the same place.",
        request=ConvertCurrencyRequestSerializer,
        responses={200: serializers.Serializer},
        operation_id='convert_currency'
    )
    def post(self, request):
        serializer = ConvertCurrencyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        place = serializer.validated_data['place'].strip().title()
        source_currency = serializer.validated_data['source_currency']
        target_currency = serializer.validated_data['target_currency']
        amount = serializer.validated_data['amount']
        target_amount = serializer.validated_data['target_amount']
        
        if amount <= 0 or target_amount <= 0:
            raise DRFValidationError("Amounts must be greater than zero.")
            
        if source_currency == target_currency:
            raise DRFValidationError("Source and target currencies must be different.")
            
        # Check if the source place and currency combination is available
        source_networth = NetWorth.objects.filter(user=user, currency=source_currency, place=place).first()
        if not source_networth:
            raise DRFValidationError(f"Place '{place}' with currency '{source_currency}' does not exist.")
            
        if source_networth.total < amount:
            raise DRFValidationError(f"Insufficient funds in '{place}'. Available: {source_networth.total} {source_currency}.")
            
        try:
            with transaction.atomic():
                # 1. Create withdraw transaction
                withdraw_trans = create_transaction(
                    user=user,
                    amount=amount,
                    currency=source_currency,
                    trans_details=f"Currency Conversion to {target_currency}",
                    category="Conversion",
                    trans_status="Withdraw",
                    transaction_date=date.today(),
                    place=place
                )
                
                # 2. Create deposit transaction
                deposit_trans = create_transaction(
                    user=user,
                    amount=target_amount,
                    currency=target_currency,
                    trans_details=f"Currency Conversion from {source_currency}",
                    category="Conversion",
                    trans_status="Deposit",
                    transaction_date=date.today(),
                    place=place
                )
        except DjangoValidationError as e:
            raise DRFValidationError(e.message)
        except Exception as e:
            raise DRFValidationError(str(e))
            
        return Response({"message": "Currency converted successfully"}, status=status.HTTP_200_OK)
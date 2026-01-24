from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from oauth2_provider.contrib.rest_framework import OAuth2Authentication, TokenHasScope
from drf_spectacular.utils import extend_schema
from django.core.exceptions import ValidationError
from django.http import Http404
from transaction_management.services import create_transaction, delete_transaction
from transaction_management.selectors import get_transactions_for_user
from finance_management.utils.get_networth import get_networth
from finance_management.utils.serializer import serialize_transaction
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from .serializers import (
    ExternalTransactionCreateSerializer,
    ExternalTransactionCreateResponseSerializer,
    ExternalTransactionDeleteResponseSerializer,
    ExternalTransactionListFilterSerializer,
    ExternalTransactionListResponseSerializer,
)


class ExternalTransactionCreateApi(APIView):
    """
    Public API endpoint for creating a transaction.
    Requires OAuth2 authentication with 'transactions:write' scope.
    """
    authentication_classes = [OAuth2Authentication]
    permission_classes = [TokenHasScope]
    required_scopes = ['transactions:write']

    @extend_schema(
        tags=['Public API'],
        description="Create a new transaction on behalf of the authenticated user. Requires OAuth2 token with 'transactions:write' scope.",
        request=ExternalTransactionCreateSerializer,
        responses={
            201: ExternalTransactionCreateResponseSerializer,
            400: 'Validation error',
            401: 'Unauthorized - Invalid or missing OAuth2 token',
            403: 'Forbidden - Token does not have required scope',
            500: 'Internal server error'
        },
        operation_id='external_create_transaction'
    )
    def post(self, request):
        """
        Create a transaction for the user associated with the OAuth2 token.
        The user is automatically determined from the OAuth2 token.
        """
        serializer = ExternalTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Get user from OAuth2 token
            user = request.user
            
            if not user:
                return Response(
                    {'error': 'User not found in token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Create the transaction using existing service
            data = serializer.validated_data
            transaction = create_transaction(
                user=user,
                amount=data['amount'],
                currency=data['currency'],
                trans_status=data['trans_status'],
                category=data.get('category'),
                trans_details=data.get('trans_details'),
                transaction_date=data.get('date')
            )

            return Response({
                'success': True,
                'message': 'Transaction created successfully',
                'transaction_id': transaction.id,
                'date': transaction.date,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'trans_status': transaction.trans_status,
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred while creating the transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExternalTransactionDeleteApi(APIView):
    """
    Public API endpoint for deleting a transaction.
    Requires OAuth2 authentication with 'transactions:write' scope.
    """
    authentication_classes = [OAuth2Authentication]
    permission_classes = [TokenHasScope]
    required_scopes = ['transactions:write']

    @extend_schema(
        tags=['Public API'],
        description="Delete a transaction on behalf of the authenticated user. Requires OAuth2 token with 'transactions:write' scope.",
        responses={
            200: ExternalTransactionDeleteResponseSerializer,
            400: 'Bad request - Cannot delete transaction',
            401: 'Unauthorized - Invalid or missing OAuth2 token',
            403: 'Forbidden - Token does not have required scope',
            404: 'Transaction not found',
            500: 'Internal server error'
        },
        operation_id='external_delete_transaction'
    )
    def delete(self, request, transaction_id):
        """
        Delete a transaction for the user associated with the OAuth2 token.
        The user is automatically determined from the OAuth2 token.
        """
        try:
            # Get user from OAuth2 token
            user = request.user
            
            if not user:
                return Response(
                    {'error': 'User not found in token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Delete the transaction using existing service
            delete_transaction(
                user=user,
                transaction_id=transaction_id,
            )

            return Response({
                'success': True,
                'message': 'Transaction deleted successfully',
            }, status=status.HTTP_200_OK)

        except Http404:
            return Response(
                {'error': 'Transaction not found or you do not have permission to delete it'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred while deleting the transaction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExternalTransactionListApi(APIView):
    """
    Public API endpoint for listing transactions.
    Requires OAuth2 authentication with 'transactions:read' scope.
    """
    authentication_classes = [OAuth2Authentication]
    permission_classes = [TokenHasScope]
    required_scopes = ['transactions:read']

    @extend_schema(
        tags=['Public API'],
        description="List transactions for the authenticated user. Requires OAuth2 token with 'transactions:read' scope. Supports filtering by date range, category, and transaction status.",
        parameters=[ExternalTransactionListFilterSerializer],
        responses={
            200: ExternalTransactionListResponseSerializer,
            400: 'Validation error',
            401: 'Unauthorized - Invalid or missing OAuth2 token',
            403: 'Forbidden - Token does not have required scope',
            500: 'Internal server error'
        },
        operation_id='external_list_transactions'
    )
    def get(self, request):
        """
        List transactions for the user associated with the OAuth2 token.
        The user is automatically determined from the OAuth2 token.
        """
        try:
            # Get user from OAuth2 token
            user = request.user
            
            if not user:
                return Response(
                    {'error': 'User not found in token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Validate query parameters
            filter_serializer = ExternalTransactionListFilterSerializer(data=request.query_params)
            filter_serializer.is_valid(raise_exception=True)
            filters = filter_serializer.validated_data

            # Get filtered transactions
            transactions_qs, start_date, end_date = get_transactions_for_user(
                user=user,
                start_date=filters.get('start_date'),
                end_date=filters.get('end_date'),
                category=filters.get('category'),
                trans_status=filters.get('trans_status'),
                details_search=None  # Don't expose details_search in public API for simplicity
            )

            # Paginate results
            paginator = Paginator(transactions_qs, 20)
            page_num = filters.get('page', 1)

            try:
                page_obj = paginator.page(page_num)
            except (PageNotAnInteger, EmptyPage):
                page_obj = paginator.page(1)

            # Serialize transactions
            trans_list = [serialize_transaction(t) for t in page_obj.object_list]

            response_data = {
                "transactions": trans_list,
                "pagination": {
                    "page": page_obj.number,
                    "num_pages": paginator.num_pages,
                    "per_page": paginator.per_page,
                    "total": paginator.count,
                },
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                }
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred while retrieving transactions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

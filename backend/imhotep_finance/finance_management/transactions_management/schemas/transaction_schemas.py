from drf_yasg import openapi
from ..serializers.transaction_serializers import (
    AddTransactionSerializer,
    AddTransactionResponseSerializer,
    UpdateTransactionSerializer,
    UpdateTransactionResponseSerializer,
    TransactionItemSerializer,
    TransactionListResponseSerializer,
)

add_transaction_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "date": openapi.Schema(type=openapi.TYPE_STRING, format="date", example="2025-10-11"),
        "amount": openapi.Schema(type=openapi.TYPE_NUMBER, example=500.00),
        "currency": openapi.Schema(type=openapi.TYPE_STRING, example="USD"),
        "trans_details": openapi.Schema(type=openapi.TYPE_STRING, example="Monthly savings deposit"),
        "category": openapi.Schema(type=openapi.TYPE_STRING, example="Savings"),
        "trans_status": openapi.Schema(type=openapi.TYPE_STRING, example="deposit"),
    },
)

add_transaction_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "networth": openapi.Schema(type=openapi.TYPE_NUMBER, example=12000.50),
        "error": openapi.Schema(type=openapi.TYPE_STRING, example="Invalid transaction type"),
    },
)

# Update transaction request/response
update_transaction_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "date": openapi.Schema(type=openapi.TYPE_STRING, format="date", example="2025-10-11"),
        "amount": openapi.Schema(type=openapi.TYPE_NUMBER, example=250.00),
        "currency": openapi.Schema(type=openapi.TYPE_STRING, example="USD"),
        "trans_details": openapi.Schema(type=openapi.TYPE_STRING, example="Fix typo in details"),
        "category": openapi.Schema(type=openapi.TYPE_STRING, example="Food"),
        "trans_status": openapi.Schema(type=openapi.TYPE_STRING, example="withdraw"),
    },
)

update_transaction_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "networth": openapi.Schema(type=openapi.TYPE_NUMBER, example=11800.00),
        "error": openapi.Schema(type=openapi.TYPE_STRING, example="Insufficient balance for this withdrawal"),
    },
)

# Get transactions query params and response
get_transactions_params = [
    openapi.Parameter(
        "start_date", openapi.IN_QUERY, description="Start date (YYYY-MM-DD)", type=openapi.TYPE_STRING, format="date"
    ),
    openapi.Parameter(
        "end_date", openapi.IN_QUERY, description="End date (YYYY-MM-DD)", type=openapi.TYPE_STRING, format="date"
    ),
    openapi.Parameter(
        "page", openapi.IN_QUERY, description="Page number (default 1)", type=openapi.TYPE_INTEGER
    ),
]

transaction_item_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER, example=123),
        "date": openapi.Schema(type=openapi.TYPE_STRING, format="date", example="2025-10-11"),
        "amount": openapi.Schema(type=openapi.TYPE_NUMBER, example=100.0),
        "currency": openapi.Schema(type=openapi.TYPE_STRING, example="USD"),
        "trans_status": openapi.Schema(type=openapi.TYPE_STRING, example="deposit"),
        "category": openapi.Schema(type=openapi.TYPE_STRING, example="Salary"),
        "trans_details": openapi.Schema(type=openapi.TYPE_STRING, example="October salary"),
    },
)

pagination_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "page": openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
        "num_pages": openapi.Schema(type=openapi.TYPE_INTEGER, example=3),
        "per_page": openapi.Schema(type=openapi.TYPE_INTEGER, example=20),
        "total": openapi.Schema(type=openapi.TYPE_INTEGER, example=57),
    },
)

get_transactions_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "transactions": openapi.Schema(type=openapi.TYPE_ARRAY, items=transaction_item_schema),
        "pagination": pagination_schema,
        "date_range": openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "start_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),
                "end_date": openapi.Schema(type=openapi.TYPE_STRING, format="date"),
            },
        ),
    },
)

# Delete transaction response
delete_transaction_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "networth": openapi.Schema(type=openapi.TYPE_NUMBER, example=11700.00),
        "message": openapi.Schema(type=openapi.TYPE_STRING, example="Transaction deleted but report update failed"),
        "error": openapi.Schema(type=openapi.TYPE_STRING, example="Error happened while deleting"),
    },
)

# Export CSV params
export_csv_params = [
    openapi.Parameter(
        "start_date", openapi.IN_QUERY, description="Start date (YYYY-MM-DD)", type=openapi.TYPE_STRING, format="date"
    ),
    openapi.Parameter(
        "end_date", openapi.IN_QUERY, description="End date (YYYY-MM-DD)", type=openapi.TYPE_STRING, format="date"
    ),
]

# Recalculate networth response (simplified)
recalculate_networth_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "message": openapi.Schema(type=openapi.TYPE_STRING, example="Networth recalculated successfully"),
        "updated_networth": openapi.Schema(type=openapi.TYPE_NUMBER, example=12000.50),
        "details": openapi.Schema(type=openapi.TYPE_OBJECT),
        "error": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

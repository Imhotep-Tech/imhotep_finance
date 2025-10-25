from drf_yasg import openapi


add_scheduled_trans_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "day_of_month": openapi.Schema(type=openapi.TYPE_INTEGER, example=25),
        "amount": openapi.Schema(type=openapi.TYPE_NUMBER, example=50.0),
        "currency": openapi.Schema(type=openapi.TYPE_STRING, example="USD"),
        "scheduled_trans_details": openapi.Schema(type=openapi.TYPE_STRING, example="Gym membership"),
        "category": openapi.Schema(type=openapi.TYPE_STRING, example="Health"),
        "scheduled_trans_status": openapi.Schema(type=openapi.TYPE_STRING, example="withdraw"),
    },
)

simple_success_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "error": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

get_scheduled_trans_params = [
    openapi.Parameter("page", openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
]

scheduled_trans_item_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "date": openapi.Schema(type=openapi.TYPE_INTEGER),
        "amount": openapi.Schema(type=openapi.TYPE_NUMBER),
        "currency": openapi.Schema(type=openapi.TYPE_STRING),
        "category": openapi.Schema(type=openapi.TYPE_STRING),
        "scheduled_trans_details": openapi.Schema(type=openapi.TYPE_STRING),
        "scheduled_trans_status": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

pagination_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "page": openapi.Schema(type=openapi.TYPE_INTEGER),
        "num_pages": openapi.Schema(type=openapi.TYPE_INTEGER),
        "per_page": openapi.Schema(type=openapi.TYPE_INTEGER),
        "total": openapi.Schema(type=openapi.TYPE_INTEGER),
    },
)

get_scheduled_trans_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "scheduled_transactions": openapi.Schema(type=openapi.TYPE_ARRAY, items=scheduled_trans_item_schema),
        "pagination": pagination_schema,
    },
)

apply_scheduled_trans_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        'applied_count': openapi.Schema(type=openapi.TYPE_INTEGER, example=3),
        'errors': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_STRING)),
    },
)



from drf_yasg import openapi


add_wish_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "year": openapi.Schema(type=openapi.TYPE_INTEGER, example=2025),
        "price": openapi.Schema(type=openapi.TYPE_NUMBER, example=199.99),
        "currency": openapi.Schema(type=openapi.TYPE_STRING, example="USD"),
        "wish_details": openapi.Schema(type=openapi.TYPE_STRING, example="New headphones"),
        "link": openapi.Schema(type=openapi.TYPE_STRING, example="https://example.com/headphones"),
    },
)

simple_success_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "error": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

update_wish_request = add_wish_request

update_wish_status_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "message": openapi.Schema(type=openapi.TYPE_STRING, example="Wish purchased"),
        "wish_status": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "networth": openapi.Schema(type=openapi.TYPE_NUMBER, example=11500.0),
    },
)

get_wishlist_params = [
    openapi.Parameter("year", openapi.IN_QUERY, description="Year filter", type=openapi.TYPE_INTEGER),
    openapi.Parameter("page", openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
]

wishlist_item_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
        "price": openapi.Schema(type=openapi.TYPE_NUMBER),
        "currency": openapi.Schema(type=openapi.TYPE_STRING),
        "wish_details": openapi.Schema(type=openapi.TYPE_STRING),
        "link": openapi.Schema(type=openapi.TYPE_STRING),
        "status": openapi.Schema(type=openapi.TYPE_BOOLEAN),
        "created_at": openapi.Schema(type=openapi.TYPE_STRING, format="date-time"),
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

get_wishlist_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "wishlist": openapi.Schema(type=openapi.TYPE_ARRAY, items=wishlist_item_schema),
        "pagination": pagination_schema,
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
    },
)



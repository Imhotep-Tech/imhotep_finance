from drf_yasg import openapi


get_networth_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "networth": openapi.Schema(type=openapi.TYPE_NUMBER),
    },
)

networth_details_item = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    additional_properties=openapi.Schema(type=openapi.TYPE_NUMBER),
)

get_networth_details_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "networth_details": networth_details_item,
    },
)

get_category_params = [
    openapi.Parameter(
        "status",
        openapi.IN_QUERY,
        description="Category status filter: Deposit | Withdraw | ANY",
        type=openapi.TYPE_STRING,
    )
]

get_category_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "category": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_STRING)),
    },
)



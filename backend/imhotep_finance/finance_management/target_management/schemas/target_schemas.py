from drf_yasg import openapi


manage_target_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "target": openapi.Schema(type=openapi.TYPE_INTEGER, example=1000),
    },
)

simple_success_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "success": openapi.Schema(type=openapi.TYPE_BOOLEAN, example=True),
        "error": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

get_score_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "score": openapi.Schema(type=openapi.TYPE_NUMBER, example=120.5),
        "target": openapi.Schema(type=openapi.TYPE_NUMBER, example=1000),
        "month": openapi.Schema(type=openapi.TYPE_INTEGER, example=10),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER, example=2025),
        "score_txt": openapi.Schema(type=openapi.TYPE_STRING, example="On target"),
    },
)

get_target_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "target": openapi.Schema(type=openapi.TYPE_NUMBER),
        "month": openapi.Schema(type=openapi.TYPE_INTEGER),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
        "score": openapi.Schema(type=openapi.TYPE_NUMBER),
    },
)

target_item_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER),
        "target": openapi.Schema(type=openapi.TYPE_NUMBER),
        "month": openapi.Schema(type=openapi.TYPE_INTEGER),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
        "score": openapi.Schema(type=openapi.TYPE_NUMBER),
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

get_score_history_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "targets": openapi.Schema(type=openapi.TYPE_ARRAY, items=target_item_schema),
        "pagination": pagination_schema,
    },
)



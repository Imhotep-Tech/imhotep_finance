from drf_yasg import openapi


get_monthly_report_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "user_withdraw_on_range": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
        "user_deposit_on_range": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
        "total_withdraw": openapi.Schema(type=openapi.TYPE_NUMBER),
        "total_deposit": openapi.Schema(type=openapi.TYPE_NUMBER),
        "current_month": openapi.Schema(type=openapi.TYPE_STRING),
        "favorite_currency": openapi.Schema(type=openapi.TYPE_STRING),
    },
)

get_report_history_months_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "report_history_months": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
    },
)

get_monthly_report_history_params = [
    openapi.Parameter("month", openapi.IN_QUERY, description="Month number 1-12", type=openapi.TYPE_INTEGER),
    openapi.Parameter("year", openapi.IN_QUERY, description="Full year", type=openapi.TYPE_INTEGER),
]

get_monthly_report_history_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "report_data": openapi.Schema(type=openapi.TYPE_OBJECT),
        "month": openapi.Schema(type=openapi.TYPE_INTEGER),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
        "created_at": openapi.Schema(type=openapi.TYPE_STRING, format="date-time"),
    },
)

get_report_history_years_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "report_history_years": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_INTEGER)),
    },
)

get_yearly_report_params = [
    openapi.Parameter("year", openapi.IN_QUERY, description="Year filter", type=openapi.TYPE_INTEGER),
]

get_yearly_report_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        "user_withdraw_on_range": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
        "user_deposit_on_range": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
        "total_withdraw": openapi.Schema(type=openapi.TYPE_NUMBER),
        "total_deposit": openapi.Schema(type=openapi.TYPE_NUMBER),
        "current_month": openapi.Schema(type=openapi.TYPE_STRING),
        "favorite_currency": openapi.Schema(type=openapi.TYPE_STRING),
        "year": openapi.Schema(type=openapi.TYPE_INTEGER),
        "months_included": openapi.Schema(type=openapi.TYPE_INTEGER),
    },
)

recalculate_reports_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Report recalculation completed'),
        'summary': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
            'total_months_processed': openapi.Schema(type=openapi.TYPE_INTEGER, example=12),
            'months_created': openapi.Schema(type=openapi.TYPE_INTEGER, example=9),
            'months_updated': openapi.Schema(type=openapi.TYPE_INTEGER, example=3),
            'errors_count': openapi.Schema(type=openapi.TYPE_INTEGER, example=0),
            'date_range': openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                'from': openapi.Schema(type=openapi.TYPE_STRING, example='January 2024'),
                'to': openapi.Schema(type=openapi.TYPE_STRING, example='December 2024'),
            })
        }),
        'processed_months': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
        'errors': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
    },
)



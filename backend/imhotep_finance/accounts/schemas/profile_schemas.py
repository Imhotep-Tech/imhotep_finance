from drf_yasg import openapi


get_profile_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
        'username': openapi.Schema(type=openapi.TYPE_STRING),
        'email': openapi.Schema(type=openapi.TYPE_STRING),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'email_verify': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'date_joined': openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
    },
)

update_profile_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'username': openapi.Schema(type=openapi.TYPE_STRING),
        'email': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

update_profile_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

change_password_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'current_password': openapi.Schema(type=openapi.TYPE_STRING),
        'new_password': openapi.Schema(type=openapi.TYPE_STRING),
        'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

change_password_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

verify_email_change_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'uid': openapi.Schema(type=openapi.TYPE_STRING),
        'token': openapi.Schema(type=openapi.TYPE_STRING),
        'new_email': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

verify_email_change_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

user_view_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
        'username': openapi.Schema(type=openapi.TYPE_STRING),
        'email': openapi.Schema(type=openapi.TYPE_STRING),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
        'email_verify': openapi.Schema(type=openapi.TYPE_BOOLEAN),
    },
)

change_fav_currency_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'fav_currency': openapi.Schema(type=openapi.TYPE_STRING, example='USD')},
)

change_fav_currency_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'success': openapi.Schema(type=openapi.TYPE_BOOLEAN)},
)

get_fav_currency_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'id': openapi.Schema(type=openapi.TYPE_INTEGER),
        'favorite_currency': openapi.Schema(type=openapi.TYPE_STRING),
    }
)



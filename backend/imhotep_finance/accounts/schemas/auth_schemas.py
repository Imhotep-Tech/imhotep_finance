from drf_yasg import openapi


login_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING, example='jane'),
        'password': openapi.Schema(type=openapi.TYPE_STRING, example='••••••••'),
    },
)

login_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
        'access': openapi.Schema(type=openapi.TYPE_STRING),
        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
        'message': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

logout_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

logout_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING, example='Logout successful'),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

register_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING),
        'email': openapi.Schema(type=openapi.TYPE_STRING),
        'password': openapi.Schema(type=openapi.TYPE_STRING),
        'password2': openapi.Schema(type=openapi.TYPE_STRING),
        'first_name': openapi.Schema(type=openapi.TYPE_STRING),
        'last_name': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

register_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

verify_email_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'uid': openapi.Schema(type=openapi.TYPE_STRING),
        'token': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

verify_email_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

# Password reset
password_reset_request_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'email': openapi.Schema(type=openapi.TYPE_STRING)},
)

password_reset_confirm_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'uid': openapi.Schema(type=openapi.TYPE_STRING),
        'token': openapi.Schema(type=openapi.TYPE_STRING),
        'new_password': openapi.Schema(type=openapi.TYPE_STRING),
        'confirm_password': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

password_reset_validate_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'uid': openapi.Schema(type=openapi.TYPE_STRING),
        'token': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

password_reset_generic_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'message': openapi.Schema(type=openapi.TYPE_STRING),
        'valid': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'email': openapi.Schema(type=openapi.TYPE_STRING),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    },
)

# Google
google_login_url_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'auth_url': openapi.Schema(type=openapi.TYPE_STRING)},
)

google_auth_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={'code': openapi.Schema(type=openapi.TYPE_STRING)},
)

google_auth_response = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'refresh': openapi.Schema(type=openapi.TYPE_STRING),
        'access': openapi.Schema(type=openapi.TYPE_STRING),
        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
        'is_new_user': openapi.Schema(type=openapi.TYPE_BOOLEAN),
        'error': openapi.Schema(type=openapi.TYPE_STRING),
    },
)



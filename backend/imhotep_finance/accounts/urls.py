from django.urls import path
from .auth.google_auth import google_callback
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .apis import (
    UserViewApi,
    GetFavCurrencyApi,
    ChangeFavCurrencyApi,
    UpdateUserLastLoginApi,
    LoginApi,
    DemoLoginApi,
    LogoutApi,
    RegisterApi,
    VerifyEmailApi,
    PasswordResetRequestApi,
    PasswordResetConfirmApi,
    PasswordResetValidateApi,
    GoogleLoginUrlApi,
    GoogleAuthApi,
    GetProfileApi,
    UpdateProfileApi,
    ChangePasswordApi,
    VerifyEmailChangeApi,
)

urlpatterns = [
    # User data
    path('user-data/', UserViewApi.as_view(), name='user_data'),

    # Favorite Currency
    path('get-fav-currency/', GetFavCurrencyApi.as_view(), name='get_fav_currency'),
    path('change-fav-currency/', ChangeFavCurrencyApi.as_view(), name='change_favorite_currency'),

    # Update Last Login
    path('update-last-login/', UpdateUserLastLoginApi.as_view(), name='update_last_login'),

    # Authentication endpoints
    path('auth/login/', LoginApi.as_view(), name='login'),
    path('auth/login/demo/', DemoLoginApi.as_view(), name='demo_login'),
    path('auth/logout/', LogoutApi.as_view(), name='logout'),
    path('auth/register/', RegisterApi.as_view(), name='register'),
    path('auth/verify-email/', VerifyEmailApi.as_view(), name='verify_email'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Password Reset endpoints
    path('auth/password-reset/', PasswordResetRequestApi.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmApi.as_view(), name='password_reset_confirm'),
    path('auth/password-reset/validate/', PasswordResetValidateApi.as_view(), name='password_reset_validate'),

    # Google OAuth endpoints
    path('auth/google/url/', GoogleLoginUrlApi.as_view(), name='google_login_url'),
    path('auth/google/authenticate/', GoogleAuthApi.as_view(), name='google_auth'),
    path('auth/google/callback/', google_callback, name='google_callback'),  # Keep this as function view (redirect)

    # Profile endpoints
    path('profile/', GetProfileApi.as_view(), name='get_profile'),
    path('profile/update/', UpdateProfileApi.as_view(), name='update_profile'),
    path('profile/change-password/', ChangePasswordApi.as_view(), name='change_password'),
    path('profile/verify-email-change/', VerifyEmailChangeApi.as_view(), name='verify_email_change'),
]
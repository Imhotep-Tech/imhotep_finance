from django.urls import path
from .auth import login, register, logout, google_auth, forget_password, profile
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .apis import (
    UserViewApi,
    GetFavCurrencyApi,
    ChangeFavCurrencyApi,
    UpdateUserLastLoginApi,
)

urlpatterns = [

    path('user-data/', UserViewApi.as_view(), name='user_data'),

        #Favorite Currency
    path('get-fav-currency/', GetFavCurrencyApi.as_view(), name='get_fav_currency'),
    path('change-fav-currency/', ChangeFavCurrencyApi.as_view(), name='change_favorite_currency'),

    #update Last Login
    path('update-last-login/', UpdateUserLastLoginApi.as_view(), name='update_last_login'),

    # Authentication endpoints
    path('auth/login/', login.login_view, name='login'),
    path('auth/login/demo/', login.demo_login_view, name='demo_login'),
    path('auth/logout/', logout.logout_view, name='logout'),
    path('auth/register/', register.register_view, name='register'),
    path('auth/verify-email/', register.verify_email, name='verify_email'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    #Password Reset endpoints
    path('auth/password-reset/', forget_password.password_reset_request, name='password_reset_request'),
    path('auth/password-reset/confirm/', forget_password.password_reset_confirm, name='password_reset_confirm'),
    path('auth/password-reset/validate/', forget_password.password_reset_validate, name='password_reset_validate'),

    #Google OAuth endpoints
    path('auth/google/url/', google_auth.google_login_url, name='google_login_url'),
    path('auth/google/authenticate/', google_auth.google_auth, name='google_auth'),
    path('auth/google/callback/', google_auth.google_callback, name='google_callback'),

    #Profile endpoints
    path('profile/', profile.get_profile, name='get_profile'),
    path('profile/update/', profile.update_profile, name='update_profile'),
    path('profile/change-password/', profile.change_password, name='change_password'),
    path('profile/verify-email-change/', profile.verify_email_change, name='verify_email_change'),


]
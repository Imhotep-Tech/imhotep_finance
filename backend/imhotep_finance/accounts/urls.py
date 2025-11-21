from django.urls import path
from .auth import login, register, logout, google_auth, forget_password, profile
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

urlpatterns = [

    path('user-data/', views.user_view, name='user_data'),

    # Authentication endpoints
    path('auth/login/', login.login_view, name='login'),
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

    #Favorite Currency
    path('get-fav-currency/', views.get_favorite_currency, name='get_fav_currency'),
    path('change-fav-currency/', views.change_favorite_currency, name='change_favorite_currency'),

    #update Last Login
    path('update-last-login/', views.update_user_last_login, name='update_last_login'),
]

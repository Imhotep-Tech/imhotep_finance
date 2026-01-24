"""
URL configuration for imhotep_finance project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.shortcuts import redirect
from imhotep_finance.settings import frontend_url
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from developer_portal.oauth_views import CustomAuthorizationView
from developer_portal.swagger_views import SwaggerOAuth2RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/finance-management/', include('finance_management.urls')),
    path('api/finance-management/scheduled-trans/', include('scheduled_trans_management.urls')),
    path('api/finance-management/target/', include('target_management.urls')),
    path('api/finance-management/', include('transaction_management.urls')),
    path('api/finance-management/', include('user_reports.urls')),
    path('api/finance-management/wishlist/', include('wishlist_management.urls')),
    # Developer Portal endpoints
    path('api/developer/', include('developer_portal.urls')),
    # Public API endpoints for third-party apps (OAuth2 protected)
    path('api/v1/external/', include('public_api.urls')),
    # OAuth2 Provider endpoints (django-oauth-toolkit) - MUST be before catch-all
    # Override the authorization view to handle JWT-based authentication
    path('o/authorize/', CustomAuthorizationView.as_view(), name='oauth2_provider:authorize'),
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    # OpenAPI 3.0 schema endpoints (automatically generated from code)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI - Interactive API documentation
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Swagger OAuth2 redirect handler (required for OAuth2 flow in Swagger UI)
    path('swagger/oauth2-redirect.html', SwaggerOAuth2RedirectView.as_view(), name='swagger-oauth2-redirect'),
    # ReDoc - Alternative API documentation
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # Catch-all: Redirect to frontend ONLY for non-API, non-OAuth2, non-admin, non-docs paths
    # Exclude: /o/, /api/, /admin/, /swagger/, /redoc/, /static/, /media/
    re_path(r'^(?!o/|api/|admin/|swagger/|redoc/|static/|media/).*$', 
            lambda request: redirect(f'{frontend_url}', permanent=False)),
]

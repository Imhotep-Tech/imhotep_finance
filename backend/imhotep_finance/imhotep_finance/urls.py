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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/finance-management/', include('finance_management.urls')),
    path('api/finance-management/scheduled-trans/', include('scheduled_trans_management.urls')),
    path('api/finance-management/target/', include('target_management.urls')),
    path('api/finance-management/', include('transaction_management.urls')),
    path('api/finance-management/', include('user_reports.urls')),
    path('api/finance-management/wishlist/', include('wishlist_management.urls')),
    # OpenAPI 3.0 schema endpoints (automatically generated from code)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI - Interactive API documentation
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # ReDoc - Alternative API documentation
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    re_path(r'^.*$', lambda request: redirect(f'{frontend_url}', permanent=False)),
]

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
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Define the schema view for Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Imhotep Finance API",
        default_version='v1',
        description="API documentation for Imhotep Finance - a personal finance management app",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="imhoteptech@outlook.com"),
        license=openapi.License(name="Dual License: AGPL-3.0 / Commercial"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/finance-management/', include('finance_management.urls')),
    path('api/finance-management/', include('scheduled_trans_management.urls')),
    path('api/finance-management/', include('target_management.urls')),
    path('api/finance-management/', include('transaction_management.urls')),
    path('api/finance-management/', include('user_reports.urls')),
    path('api/finance-management/', include('wishlist_management.urls')),
    # Add Swagger UI and ReDoc URLs before the catch-all redirect
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^.*$', lambda request: redirect(f'{frontend_url}', permanent=False)),
]

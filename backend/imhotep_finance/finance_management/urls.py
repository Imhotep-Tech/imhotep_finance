from django.urls import path, include
from .apis import GetNetworthApi, GetNetworthDetailsApi, GetCategoryApi

urlpatterns = [
    # Core finance management endpoints - New DDD class-based APIs
    path('get-networth/', GetNetworthApi.as_view(), name='get_networth'),
    path('get-networth-details/', GetNetworthDetailsApi.as_view(), name='get_netWorth_details'),
    path('get-category/', GetCategoryApi.as_view(), name='get_category'),
    
    # Sub-app endpoints
    path('transaction/', include('transaction_management.urls')),
    path('', include('scheduled_trans_management.urls')),
    path('', include('target_management.urls')),
    path('reports/', include('user_reports.urls')),
    path('', include('wishlist_management.urls')),
]

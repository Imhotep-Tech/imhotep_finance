from django.urls import path, include
from django.shortcuts import redirect
from . import views

urlpatterns = [
    # Core finance management endpoints (still in this app)
    path('get-networth/', views.get_user_networth, name='get_networth'),
    path('get-networth-details/', views.get_user_netWorth_details, name='get_netWorth_details'),
    path('get-category/', views.get_user_category, name='get_category'),
    
    # Redirect old transaction endpoints to new app
    path('transaction/', include('transaction_management.urls')),
    
    # Redirect old scheduled transaction endpoints to new app
    path('scheduled-trans/', include('scheduled_trans_management.urls')),
    
    # Target Management
    path('', include('target_management.urls')),
    
    # Redirect old report endpoints to new app
    path('reports/', include('user_reports.urls')),
    
    # Wishlist Management
    path('', include('wishlist_management.urls')),
]

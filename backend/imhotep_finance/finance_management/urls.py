from django.urls import path
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .transactions_management import transactions_management

urlpatterns = [
    #user data
    path('get-fav-currency/', views.get_favorite_currency, name='get_fav_currency'),
    path('get-networth/', views.get_user_networth, name='get_networth'),
    path('get-category/', views.get_user_category, name='get_category'),

    #trans management
    path('add-transactions/', transactions_management.add_transactions, name='add_transactions'),
]

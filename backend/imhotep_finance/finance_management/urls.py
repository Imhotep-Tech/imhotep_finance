from django.urls import path
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .transactions_management import add_transaction, get_tranaction, update_transaction, delete_transaction

urlpatterns = [
    #user data
    path('get-fav-currency/', views.get_favorite_currency, name='get_fav_currency'),
    path('get-networth/', views.get_user_networth, name='get_networth'),
    path('get-networth-details/', views.get_user_netWorth_details, name='get_netWorth_details'),
    path('get-category/', views.get_user_category, name='get_category'),

    #trans management
    path('transaction/add-transactions/', add_transaction.add_transactions, name='add_transactions'),
    path('transaction/get-transactions/', get_tranaction.get_transaction, name='get_transaction'),
    path('transaction/update-transactions/<int:trans_id>/', update_transaction.update_transactions, name='update_transaction'),
    path('transaction/delete-transactions/<int:trans_id>/', delete_transaction.delete_transaction, name='delete_transaction'),
]

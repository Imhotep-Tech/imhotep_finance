from django.urls import path
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .transactions_management import add_transaction, get_tranaction, update_transaction, delete_transaction
from .wishlist_management import add_wish, get_wishlist, update_wish, update_wish_status, delete_wish

urlpatterns = [
    #user data
    path('get-networth/', views.get_user_networth, name='get_networth'),
    path('get-networth-details/', views.get_user_netWorth_details, name='get_netWorth_details'),
    path('get-category/', views.get_user_category, name='get_category'),

    #trans management
    path('transaction/add-transactions/', add_transaction.add_transactions, name='add_transactions'),
    path('transaction/get-transactions/', get_tranaction.get_transaction, name='get_transaction'),
    path('transaction/update-transactions/<int:trans_id>/', update_transaction.update_transactions, name='update_transaction'),
    path('transaction/delete-transactions/<int:trans_id>/', delete_transaction.delete_transaction, name='delete_transaction'),

    #wishlist management
    path('wishlist/add-wish/', add_wish.add_wish, name='add_wish'),
    path('wishlist/get-wishlist/', get_wishlist.get_wishlist, name='get_wishlist'),
    path('wishlist/update-wish-status/<int:wish_id>/', update_wish_status.update_wish_status, name='update_wish_status'),
    path('wishlist/update-wish/<int:wish_id>/', update_wish.update_wish, name='update_wish'),
    path('wishlist/delete-wish/<int:wish_id>/', delete_wish.delete_wish, name='delete_wish'),
]

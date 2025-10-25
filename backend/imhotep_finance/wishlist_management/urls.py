from django.urls import path
from .wishlist_management import add_wish, get_wishlist, update_wish, update_wish_status, delete_wish

urlpatterns = [
    #wishlist management
    path('add-wish/', add_wish.add_wish, name='add_wish'),
    path('get-wishlist/', get_wishlist.get_wishlist, name='get_wishlist'),
    path('update-wish-status/<int:wish_id>/', update_wish_status.update_wish_status, name='update_wish_status'),
    path('update-wish/<int:wish_id>/', update_wish.update_wish, name='update_wish'),
    path('delete-wish/<int:wish_id>/', delete_wish.delete_wish, name='delete_wish'),

]

from django.urls import path
from .wishlist_management import add_wish, get_wishlist, update_wish, update_wish_status, delete_wish

urlpatterns = [
    #wishlist management
    path('wishlist/add-wish/', add_wish.add_wish, name='add_wish'),
    path('wishlist/get-wishlist/', get_wishlist.get_wishlist, name='get_wishlist'),
    path('wishlist/update-wish-status/<int:wish_id>/', update_wish_status.update_wish_status, name='update_wish_status'),
    path('wishlist/update-wish/<int:wish_id>/', update_wish.update_wish, name='update_wish'),
    path('wishlist/delete-wish/<int:wish_id>/', delete_wish.delete_wish, name='delete_wish'),

]

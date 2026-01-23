from django.urls import path
from .apis import (
    WishCreateApi,
    WishDeleteApi,
    WishUpdateApi,
    GetWishlistApi,
    UpdateWishlistStatusApi,
)

urlpatterns = [
    # wishlist management
    path('wishlist/add-wish/', WishCreateApi.as_view(), name='create_wish'),  # Changed from create-wish
    path('wishlist/delete-wish/<int:wish_id>/', WishDeleteApi.as_view(), name='delete_wish'),
    path('wishlist/update-wish/<int:wish_id>/', WishUpdateApi.as_view(), name='update_wish'),
    path('wishlist/get-wishlist/', GetWishlistApi.as_view(), name='get_wishlist'),
    path('wishlist/update-wish-status/<int:wish_id>/', UpdateWishlistStatusApi.as_view(), name='update_wish_status'),
]

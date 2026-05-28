from django.urls import path
from .sync_views import MobileSyncApi

urlpatterns = [
    path('push/', MobileSyncApi.as_view(), name='mobile_sync_push'),
]

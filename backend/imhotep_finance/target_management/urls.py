from django.urls import path
from .apis import (
    TargetManagementApi,
    GetTargetApi,
    GetScoreApi,
    GetScoreHistoryApi
)

urlpatterns = [
    path('manage-target/', TargetManagementApi.as_view(), name='manage_target'),
    path('get-target/', GetTargetApi.as_view(), name='get_target'),
    path('get-score/', GetScoreApi.as_view(), name='get_score'),
    path('get-score-history/', GetScoreHistoryApi.as_view(), name='get_score_history'),
]
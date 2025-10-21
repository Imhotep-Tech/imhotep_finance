from django.urls import path
from .target_management import get_score, get_target, manage_target, get_score_history

urlpatterns = [
    #Target Management
    path('target/get-score/', get_score.get_score, name='get_score'),
    path('target/get-target/', get_target.get_target, name='get_target'),
    path('target/manage-target/', manage_target.manage_target, name='manage_target'),
    path('target/get-score-history/', get_score_history.get_score_history, name='get_score_history'),
]
from django.urls import path
from .apis import (
    ScheduledTransactionCreateApi,
    ScheduledTransactionDeleteApi,
    ScheduledTransactionUpdateApi,
    ScheduledTransactionListApi,
    ToggleScheduledTransactionStatusApi,
    ApplyScheduledTransactionsApi
)

urlpatterns = [
    #Scheduled Transaction management
    path('scheduled-trans/add-scheduled-trans/', ScheduledTransactionCreateApi.as_view(), name='add_scheduled_trans'),
    path('scheduled-trans/delete-scheduled-trans/<int:scheduled_trans_id>/', ScheduledTransactionDeleteApi.as_view(), name='delete_scheduled_trans'),
    path('scheduled-trans/update-scheduled-trans/<int:scheduled_trans_id>/', ScheduledTransactionUpdateApi.as_view(), name='update_scheduled_trans'),
    path('scheduled-trans/get-scheduled-trans/', ScheduledTransactionListApi.as_view(), name='get_scheduled_trans'),
    path('scheduled-trans/update-scheduled-trans-status/<int:scheduled_trans_id>/', ToggleScheduledTransactionStatusApi.as_view(), name='toggle_scheduled_status'),  # Changed URL
    path('scheduled-trans/apply-scheduled-trans/', ApplyScheduledTransactionsApi.as_view(), name='apply_scheduled_trans'),
]

from django.urls import path
from .apis import (
    ExternalTransactionCreateApi,
    ExternalTransactionDeleteApi,
    ExternalTransactionListApi,
)

urlpatterns = [
    path('transaction/add/', ExternalTransactionCreateApi.as_view(), name='external_create_transaction'),
    path('transaction/list/', ExternalTransactionListApi.as_view(), name='external_list_transactions'),
    path('transaction/delete/<int:transaction_id>/', ExternalTransactionDeleteApi.as_view(), name='external_delete_transaction'),
]

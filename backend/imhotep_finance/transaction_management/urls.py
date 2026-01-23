from django.urls import path
from .apis import (
    TransactionCreateApi,
    TransactionListApi,
    TransactionUpdateApi,
    TransactionDeleteApi,
    TransactionExportCSVApi,
    TransactionImportCSVApi,
    RecalculateNetworthApi
)

urlpatterns = [
    path('transaction/add-transactions/', TransactionCreateApi.as_view(), name='add_transactions'),
    path('transaction/get-transactions/', TransactionListApi.as_view(), name='get_transaction'),
    path('transaction/update-transactions/<int:transaction_id>/', TransactionUpdateApi.as_view(), name='update_transaction'),
    path('transaction/delete-transactions/<int:transaction_id>/', TransactionDeleteApi.as_view(), name='delete_transaction'),
    path('transaction/export-csv/', TransactionExportCSVApi.as_view(), name='export_transactions_csv'),
    path('transaction/import-csv/', TransactionImportCSVApi.as_view(), name='import_transactions_csv'),
    path('recalculate-networth/', RecalculateNetworthApi.as_view(), name='recalculate_networth'),
]
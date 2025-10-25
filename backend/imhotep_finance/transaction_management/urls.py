from django.urls import path
from .transactions_management import add_transaction, get_tranaction, update_transaction, delete_transaction, export_transactions_csv, recalculate_networth_endpoint

urlpatterns = [
     #trans management
    path('transaction/add-transactions/', add_transaction.add_transactions, name='add_transactions'),
    path('transaction/get-transactions/', get_tranaction.get_transaction, name='get_transaction'),
    path('transaction/update-transactions/<int:trans_id>/', update_transaction.update_transactions, name='update_transaction'),
    path('transaction/delete-transactions/<int:trans_id>/', delete_transaction.delete_transaction, name='delete_transaction'),
    path('transaction/export-csv/', export_transactions_csv.export_transactions_csv, name='export_transactions_csv'),
    path('recalculate-networth/', recalculate_networth_endpoint.recalculate_networth_endpoint, name='recalculate_networth'),
]
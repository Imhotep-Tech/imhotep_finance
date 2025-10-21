from django.urls import path
from .scheduled_trans_management import add_scheduled_trans, get_scheduled_trans, update_scheduled_trans, update_scheduled_trans_status, delete_scheduled_trans, apply_scheduled_trans

urlpatterns = [
    #Scheduled Transaction management
    path('scheduled-trans/add-scheduled-trans/', add_scheduled_trans.add_scheduled_transactions, name='add_scheduled_transactions'),
    path('scheduled-trans/get-scheduled-trans/', get_scheduled_trans.get_scheduled_transaction, name='get_scheduled_transaction'),
    path('scheduled-trans/update-scheduled-trans-status/<int:scheduled_trans_id>/', update_scheduled_trans_status.update_scheduled_trans_status, name='update_scheduled_trans_status'),
    path('scheduled-trans/update-scheduled-trans/<int:scheduled_trans_id>/', update_scheduled_trans.update_scheduled_transactions, name='update_scheduled_transactions'),
    path('scheduled-trans/delete-scheduled-trans/<int:scheduled_trans_id>/', delete_scheduled_trans.delete_scheduled_trans, name='delete_scheduled_trans'),
    path('scheduled-trans/apply-scheduled-trans/', apply_scheduled_trans.apply_scheduled_trans, name='apply_scheduled_trans'),
]

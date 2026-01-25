from unfold.admin import ModelAdmin
from django import forms
from django.contrib import admin
from .models import ScheduledTransaction

class ScheduledTransactionAdminForm(forms.ModelForm):
    """Custom form to show both capitalized and lowercase options"""
    scheduled_trans_status = forms.ChoiceField(
        choices=[
            ('Deposit', '💰 Deposit'),
            ('deposit', '💰 deposit'),
            ('Withdraw', '💸 Withdraw'),
            ('withdraw', '💸 withdraw'),
        ],
        required=True,
        label='Transaction Status'
    )
    
    class Meta:
        model = ScheduledTransaction
        fields = '__all__'

@admin.register(ScheduledTransaction)
class ScheduledTransactionAdmin(ModelAdmin):
    form = ScheduledTransactionAdminForm  # Use custom form
    
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'amount', 
        'currency', 
        'scheduled_trans_status', 
        'scheduled_trans_details', 
        'category',
        'date'
    ]
    
    list_filter = [
        'scheduled_trans_status', 
        'currency', 
        'category', 
        'status',
        'date',
        'created_at',
        'last_time_added',
        'user'
    ]
    
    list_display = [
        'user', 
        'date', 
        'amount', 
        'currency', 
        'get_scheduled_trans_status_display_formatted',  # Changed from 'scheduled_trans_status'
        'category', 
        'get_status_display',
        'last_time_added',
        'created_at'
    ]
    
    list_display_links = ['user']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    def get_scheduled_trans_status_display_formatted(self, obj):
        """Format scheduled transaction status for display"""
        status_map = {
            'deposit': '💰 Deposit',
            'withdraw': '💸 Withdraw',
            'Deposit': '💰 Deposit',
            'Withdraw': '💸 Withdraw',
        }
        return status_map.get(obj.scheduled_trans_status, obj.scheduled_trans_status.capitalize())
    get_scheduled_trans_status_display_formatted.short_description = 'Type'
    get_scheduled_trans_status_display_formatted.admin_order_field = 'scheduled_trans_status'
    
    def get_status_display(self, obj):
        return "✅ Active" if obj.status else "❌ Inactive"
    get_status_display.short_description = 'Status'

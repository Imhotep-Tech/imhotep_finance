from django.contrib import admin
from django import forms
from .models import Transactions, NetWorth
from unfold.admin import ModelAdmin

class TransactionAdminForm(forms.ModelForm):
    """Custom form to show both capitalized and lowercase options"""
    trans_status = forms.ChoiceField(
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
        model = Transactions
        fields = '__all__'

@admin.register(Transactions)
class TransactionsAdmin(ModelAdmin):
    form = TransactionAdminForm  # Use custom form

    # Add search functionality
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'amount', 
        'currency', 
        'trans_status', 
        'trans_details', 
        'category',
        'date'
    ]
    
    # Add filters for easy navigation
    list_filter = [
        'trans_status', 
        'currency', 
        'category', 
        'date', 
        'created_at',
        'user'
    ]
    
    # Display these fields in the list view
    list_display = [
        'user', 
        'date', 
        'amount', 
        'currency', 
        'get_trans_status_display_formatted',  # Changed from 'trans_status'
        'category', 
        'trans_details', 
        'created_at'
    ]
    
    # Make these fields clickable links
    list_display_links = ['user', 'trans_details']
    
    # Add date hierarchy for easy date navigation
    date_hierarchy = 'date'
    
    # Items per page
    list_per_page = 50
    
    # Fields to show when editing
    fields = [
        'user', 
        'date', 
        'amount', 
        'currency', 
        'trans_status', 
        'category', 
        'trans_details'
    ]

    def get_trans_status_display_formatted(self, obj):
        """Format transaction status for display"""
        status_map = {
            'deposit': '💰 Deposit',
            'withdraw': '💸 Withdraw',
            'Deposit': '💰 Deposit',
            'Withdraw': '💸 Withdraw',
        }
        return status_map.get(obj.trans_status, obj.trans_status.capitalize())
    get_trans_status_display_formatted.short_description = 'Status'
    get_trans_status_display_formatted.admin_order_field = 'trans_status'  # Allows column ordering

@admin.register(NetWorth)
class NetWorthAdmin(admin.ModelAdmin):
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'total', 
        'currency'
    ]
    
    list_filter = [
        'currency', 
        'created_at',
        'user'
    ]
    
    list_display = [
        'user', 
        'total', 
        'currency', 
        'created_at'
    ]
    
    list_display_links = ['user']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50

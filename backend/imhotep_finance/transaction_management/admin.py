from django.contrib import admin
from .models import Transactions, NetWorth

@admin.register(Transactions)
class TransactionsAdmin(admin.ModelAdmin):
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
        'trans_status', 
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

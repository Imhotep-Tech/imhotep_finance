from django.contrib import admin
from .models import Transactions, NetWorth, Wishlist, ScheduledTransaction, Target, Reports

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

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'price', 
        'currency', 
        'wish_details', 
        'link',
        'year'
    ]
    
    list_filter = [
        'status', 
        'currency', 
        'year', 
        'created_at',
        'user'
    ]
    
    list_display = [
        'user', 
        'wish_details', 
        'price', 
        'currency', 
        'status', 
        'year', 
        'transaction',
        'created_at'
    ]
    
    list_display_links = ['user', 'wish_details']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    # Add boolean icons for status
    list_display = [
        'user', 
        'wish_details', 
        'price', 
        'currency', 
        'get_status_display', 
        'year', 
        'transaction',
        'created_at'
    ]
    
    def get_status_display(self, obj):
        return "✅ Purchased" if obj.status else "⏳ Pending"
    get_status_display.short_description = 'Status'

@admin.register(ScheduledTransaction)
class ScheduledTransactionAdmin(admin.ModelAdmin):
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
        'scheduled_trans_status', 
        'category', 
        'get_status_display',
        'last_time_added',
        'created_at'
    ]
    
    list_display_links = ['user']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    def get_status_display(self, obj):
        return "✅ Active" if obj.status else "❌ Inactive"
    get_status_display.short_description = 'Status'

@admin.register(Target)
class TargetAdmin(admin.ModelAdmin):
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'target', 
        'month', 
        'year', 
        'score'
    ]
    
    list_filter = [
        'month', 
        'year', 
        'created_at',
        'user'
    ]
    
    list_display = [
        'user', 
        'get_month_year', 
        'target', 
        'score', 
        'get_progress_percentage',
        'created_at'
    ]
    
    list_display_links = ['user', 'get_month_year']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    def get_month_year(self, obj):
        months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        return f"{months[obj.month - 1]} {obj.year}"
    get_month_year.short_description = 'Period'
    
    def get_progress_percentage(self, obj):
        if obj.target == 0:
            return "N/A"
        percentage = (obj.score / obj.target) * 100
        return f"{percentage:.1f}%"
    get_progress_percentage.short_description = 'Progress'

@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    search_fields = [
        'user__username', 
        'user__email', 
        'user__first_name', 
        'user__last_name',
        'month', 
        'year'
    ]
    
    list_filter = [
        'month', 
        'year', 
        'created_at',
        'user'
    ]
    
    list_display = [
        'user', 
        'get_month_year', 
        'get_total_deposit',
        'get_total_withdraw',
        'get_net_difference',
        'created_at'
    ]
    
    list_display_links = ['user', 'get_month_year']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    # Make data field read-only since it's JSON
    readonly_fields = ['data']
    
    def get_month_year(self, obj):
        months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        return f"{months[obj.month - 1]} {obj.year}"
    get_month_year.short_description = 'Period'
    
    def get_total_deposit(self, obj):
        total = obj.data.get('total_deposit', 0)
        currency = obj.data.get('favorite_currency', 'USD')
        return f"{total:.2f} {currency}"
    get_total_deposit.short_description = 'Total Income'
    
    def get_total_withdraw(self, obj):
        total = obj.data.get('total_withdraw', 0)
        currency = obj.data.get('favorite_currency', 'USD')
        return f"{total:.2f} {currency}"
    get_total_withdraw.short_description = 'Total Expenses'
    
    def get_net_difference(self, obj):
        deposit = obj.data.get('total_deposit', 0)
        withdraw = obj.data.get('total_withdraw', 0)
        difference = deposit - withdraw
        currency = obj.data.get('favorite_currency', 'USD')
        symbol = "+" if difference >= 0 else "-"
        return f"{symbol}{abs(difference):.2f} {currency}"
    get_net_difference.short_description = 'Net Difference'

# Alternative way to register (if you prefer the original style)
# admin.site.register(Transactions, TransactionsAdmin)
# admin.site.register(NetWorth, NetWorthAdmin)
# admin.site.register(Wishlist, WishlistAdmin)
# admin.site.register(ScheduledTransaction, ScheduledTransactionAdmin)
# admin.site.register(Target, TargetAdmin)
# admin.site.register(Reports, ReportsAdmin)
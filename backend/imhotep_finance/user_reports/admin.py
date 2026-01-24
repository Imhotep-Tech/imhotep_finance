from django.contrib import admin
from .models import Reports

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
        """Display total deposit from report data"""
        if obj.data:
            # If data is encrypted string, parse it as JSON
            if isinstance(obj.data, str):
                import json
                try:
                    data = json.loads(obj.data)
                except json.JSONDecodeError:
                    return "Error parsing data"
            else:
                data = obj.data
            return data.get('total_deposit', 0)
        return 0
    get_total_deposit.short_description = 'Total Income'
    
    def get_total_withdraw(self, obj):
        """Display total withdraw from report data"""
        if obj.data:
            # If data is encrypted string, parse it as JSON
            if isinstance(obj.data, str):
                import json
                try:
                    data = json.loads(obj.data)
                except json.JSONDecodeError:
                    return "Error parsing data"
            else:
                data = obj.data
            return data.get('total_withdraw', 0)
        return 0
    get_total_withdraw.short_description = 'Total Expenses'
    
    def get_net_difference(self, obj):
        if obj.data:
            # If data is encrypted string, parse it as JSON
            if isinstance(obj.data, str):
                import json
                try:
                    data = json.loads(obj.data)
                except json.JSONDecodeError:
                    return "Error parsing data"
            else:
                data = obj.data
            
            deposit = data.get('total_deposit', 0)
            withdraw = data.get('total_withdraw', 0)
            difference = deposit - withdraw
            currency = data.get('favorite_currency', 'USD')
            symbol = "+" if difference >= 0 else "-"
            return f"{symbol}{abs(difference):.2f} {currency}"
        return "0.00"
    get_net_difference.short_description = 'Net Difference'

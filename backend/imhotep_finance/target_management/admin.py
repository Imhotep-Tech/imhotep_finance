from django.contrib import admin
from .models import Target

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

from django.contrib import admin
from .models import Wishlist
from unfold.admin import ModelAdmin

@admin.register(Wishlist)
class WishlistAdmin(ModelAdmin):
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
        'get_status_display', 
        'year', 
        'transaction',
        'created_at'
    ]
    
    list_display_links = ['user', 'wish_details']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    def get_status_display(self, obj):
        return "✅ Purchased" if obj.status else "⏳ Pending"
    get_status_display.short_description = 'Status'

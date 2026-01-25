from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import BaseExchangeRate

@admin.register(BaseExchangeRate)
class BaseExchangeRateAdmin(ModelAdmin):
    list_display = ('base_currency', 'last_updated')
    readonly_fields = ('last_updated',)
    fields = ('base_currency', 'rates', 'last_updated')

# Register your models here.
# Note: Models have been moved to their respective apps:
# - Transactions, NetWorth -> transaction_management
# - Wishlist -> wishlist_management  
# - ScheduledTransaction -> scheduled_trans_management
# - Target -> target_management
# - Reports -> user_reports
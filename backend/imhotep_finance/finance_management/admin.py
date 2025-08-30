from django.contrib import admin
from .models import Transactions, NetWorth, Wishlist, ScheduledTransaction, Target

admin.site.register(Transactions)
admin.site.register(NetWorth)
admin.site.register(Wishlist)
admin.site.register(ScheduledTransaction)
admin.site.register(Target)
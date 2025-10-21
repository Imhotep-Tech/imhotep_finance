from django.db import models
from accounts.models import User
from django.utils import timezone

def current_year():
    return timezone.now().year

def current_day():
    return timezone.now().day

class ScheduledTransaction(models.Model):
    
    TRANSACTIONS_STATUS = (
        ('Withdraw', 'withdraw'),
        ('Deposit', 'deposit')
    )


    SCHEDULED_TRANSACTIONS_STATUS = [
        (True, "Active"),
        (False, "Inactive"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_transaction_user')
    date = models.IntegerField(default=current_day)
    amount = models.FloatField()
    currency = models.CharField(max_length=4)
    scheduled_trans_status = models.CharField(max_length=8, choices=TRANSACTIONS_STATUS)
    scheduled_trans_details = models.TextField(blank=True, null=True)
    category = models.TextField(blank=True, null=True)
    last_time_added = models.DateTimeField(blank=True, null=True)
    status =  models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"ScheduledTransaction of {self.user.username} ({self.date}) with amount {self.amount} and status {self.scheduled_trans_status}"
    
    class Meta:
        verbose_name = "ScheduledTransaction"
        verbose_name_plural = "ScheduledTransactions"
        ordering = ['-created_at']

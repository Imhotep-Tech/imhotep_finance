from django.db import models
from accounts.models import User
from django.utils import timezone
from encrypted_model_fields.fields import EncryptedCharField

# Create your models here.
class Transactions(models.Model):

    TRANSACTIONS_STATUS = (
        ('Withdraw', 'withdraw'),
        ('Deposit', 'deposit')
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField(default=timezone.now)
    amount = models.FloatField()
    currency = models.CharField(max_length=4)
    trans_status = models.CharField(max_length=8, choices=TRANSACTIONS_STATUS)
    trans_details = EncryptedCharField(max_length=255, blank=True, null=True)
    category = EncryptedCharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Transaction of {self.user.username} ({self.date.strftime('%Y-%m-%d')}) with amount {self.amount} and Status of {self.trans_status}"
    
    class Meta:
        db_table = 'finance_management_transactions'
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ['-created_at']

class NetWorth(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='netWorths')
    total = models.FloatField(default=0.0)
    currency = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"NetWorth of {self.user.username} with currency {self.currency}"
    
    class Meta:
        db_table = 'finance_management_networth'
        verbose_name = "NetWorth"
        verbose_name_plural = "NetWorth"
        ordering = ['-created_at']

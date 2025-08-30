from django.db import models
from accounts.models import User
from django.utils import timezone

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
    trans_details = models.TextField(blank=True, null=True)
    category = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Transaction of {self.user.username} ({self.date.strftime('%Y-%m-%d')}) with amount {self.amount} and Status of {self.trans_status}"
    
    class Meta:
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
        verbose_name = "NetWorth"
        verbose_name_plural = "NetWorth"
        ordering = ['-created_at']


def current_year():
    return timezone.now().year

def current_day():
    return timezone.now().day

class Wishlist(models.Model):

    STATUS_CHOICES = [
        (True, "Purchased"),
        (False, "Pending"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_user')
    transaction = models.ForeignKey(
        'Transactions',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wishlist_transaction'
    )
    year = models.IntegerField(default=current_year)
    price = models.FloatField()
    currency = models.CharField(max_length=4)
    status = models.BooleanField(choices=STATUS_CHOICES, default=False)
    link = models.TextField(blank=True, null=True)
    wish_details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist of {self.user.username} ({self.year}) with amount {self.price} and status {self.status} and currency {self.currency}"
    
    class Meta:
        verbose_name = "Wishlist"
        verbose_name_plural = "Wishlists"
        ordering = ['-created_at']

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

class Target(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='target_user')
    target = models.IntegerField()
    month = models.IntegerField()
    year = models.IntegerField()
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Target of {self.user.username} - {self.month}/{self.year}: {self.score}/{self.target}"

    class Meta:
        verbose_name = "Target"
        verbose_name_plural = "Targets"
        ordering = ['-created_at']
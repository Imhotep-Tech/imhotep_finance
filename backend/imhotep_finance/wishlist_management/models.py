from django.db import models
from accounts.models import User
from django.utils import timezone
from encrypted_model_fields.fields import EncryptedCharField

def current_year():
    return timezone.now().year

def current_day():
    return timezone.now().day


# Create your models here.
class Wishlist(models.Model):

    STATUS_CHOICES = [
        (True, "Purchased"),
        (False, "Pending"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_user')
    transaction = models.ForeignKey(
        'transaction_management.Transactions',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wishlist_transaction'
    )
    year = models.IntegerField(default=current_year)
    price = models.FloatField()
    currency = models.CharField(max_length=4)
    status = models.BooleanField(choices=STATUS_CHOICES, default=False)
    link = EncryptedCharField(max_length=255, blank=True, null=True)
    wish_details = EncryptedCharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist of {self.user.username} ({self.year}) with amount {self.price} and status {self.status} and currency {self.currency}"
    
    class Meta:
        db_table = 'finance_management_wishlist'
        verbose_name = "Wishlist"
        verbose_name_plural = "Wishlists"
        ordering = ['-created_at']

from django.db import models
from accounts.models import User
from django.utils import timezone

# Create your models here.
#for the old models that have been moved to the respective apps
def current_year():
    return timezone.now().year

def current_day():
    return timezone.now().day

class BaseExchangeRate(models.Model):
    base_currency = models.CharField(max_length=10, default='USD', unique=True)
    rates = models.JSONField(default=dict)  # {'EUR': 0.92, 'GBP': 0.73, ...}
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Exchange rates for {self.base_currency} (updated: {self.last_updated})"
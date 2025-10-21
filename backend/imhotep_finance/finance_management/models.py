from django.db import models
from accounts.models import User
from django.utils import timezone

# Create your models here.
#for the old models that have been moved to the respective apps
def current_year():
    return timezone.now().year

def current_day():
    return timezone.now().day

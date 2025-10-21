from django.db import models
from accounts.models import User

class Target(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='target_user')
    target = models.IntegerField()
    month = models.IntegerField()
    year = models.IntegerField()
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Target of {self.user.username} - {self.month}/{self.year}: {self.score}/{self.target}"

    class Meta:
        verbose_name = "Target"
        verbose_name_plural = "Targets"
        ordering = ['-created_at']

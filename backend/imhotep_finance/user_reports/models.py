from django.db import models
from accounts.models import User

# Create your models here.
class Reports(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_user')
    month = models.IntegerField()
    year = models.IntegerField()
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Report of {self.user.username} - {self.month}/{self.year} ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        db_table = 'finance_management_reports'
        verbose_name = "Report"
        verbose_name_plural = "Reports"
        ordering = ['-created_at']
from django.db import models
from oauth2_provider.models import Application
from accounts.models import User


class DeveloperProfile(models.Model):
    """
    Extended profile for developers managing OAuth2 applications.
    This can be used for future enhancements like organization info, etc.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='developer_profile'
    )
    organization_name = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Developer Profile: {self.user.username}"

    class Meta:
        db_table = 'developer_portal_developerprofile'
        verbose_name = "Developer Profile"
        verbose_name_plural = "Developer Profiles"

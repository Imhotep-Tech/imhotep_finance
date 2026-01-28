from unfold.admin import ModelAdmin
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

User = get_user_model()
@admin.register(User)
class UserAdmin(ModelAdmin, BaseUserAdmin):
    list_display = ("id", "username", "email", "is_staff", "is_active", "reset_password_button")
    search_fields = ("username", "email")
    
    # Add custom fields to the detail view
    fieldsets = (
        (None, {'fields': ('username', 'password_reset_link', 'email', 'email_verify')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'favorite_currency')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    readonly_fields = ('password_reset_link', 'last_login', 'date_joined')
    
    def password_reset_link(self, obj):
        """Display password info and reset button on detail page"""
        if obj.pk:
            url = reverse('admin:auth_user_password_change', args=[obj.pk])
            password_info = obj.password[:50] + '...' if len(obj.password) > 50 else obj.password
            return format_html(
                '<div style="margin-bottom: 10px;">'
                '<strong>Current:</strong> {}<br><br>'
                '<a class="button" href="{}" style="padding: 10px 15px; background-color: #417690; color: white; text-decoration: none; border-radius: 4px;">Change Password</a>'
                '</div>',
                password_info,
                url
            )
        return "Set password after creating user"
    password_reset_link.short_description = "Password"
    
    def reset_password_button(self, obj):
        """Display a reset password button for each user in list view"""
        url = reverse('admin:auth_user_password_change', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Reset Password</a>',
            url
        )
    reset_password_button.short_description = "Password"
    reset_password_button.allow_tags = True

# Register your models here.

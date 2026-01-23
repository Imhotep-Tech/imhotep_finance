from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies

class UserViewResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="User ID")
    username = serializers.CharField(help_text="Username")
    email = serializers.EmailField(help_text="Email address")
    first_name = serializers.CharField(help_text="First name")
    last_name = serializers.CharField(help_text="Last name")
    email_verify = serializers.BooleanField(help_text="Email verification status")

class ChangeFavCurrencyRequestSerializer(serializers.Serializer):
    fav_currency = serializers.ChoiceField(
        choices=[(c, c) for c in get_allowed_currencies()],
        required=True,
        help_text="Favorite currency code (e.g., USD, EUR)."
    )

class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(
        help_text="Username or email address of the user."
    )
    password = serializers.CharField(
        write_only=True,
        help_text="Password of the user."
    )

class LoginResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="JWT refresh token")
    access = serializers.CharField(help_text="JWT access token")
    user = UserViewResponseSerializer(help_text="Authenticated user details")

class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Desired username for the new user.")
    email = serializers.EmailField(help_text="Email address of the new user.")
    password = serializers.CharField(write_only=True, help_text="Password for the new user.")
    password2 = serializers.CharField(write_only=True, help_text="Password confirmation.")
    first_name = serializers.CharField(required=False, allow_blank=True, help_text="First name of the new user.")
    last_name = serializers.CharField(required=False, allow_blank=True, help_text="Last name of the new user.")

class VerifyEmailRequestSerializer(serializers.Serializer):
    uid = serializers.CharField(help_text="Base64 encoded user ID.")
    token = serializers.CharField(help_text="Email verification token.")

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="Email address for password reset.")

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(help_text="Base64 encoded user ID.")
    token = serializers.CharField(help_text="Password reset token.")
    new_password = serializers.CharField(write_only=True, help_text="New password.")
    confirm_password = serializers.CharField(write_only=True, help_text="Confirm new password.")

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

class PasswordResetValidateSerializer(serializers.Serializer):
    uid = serializers.CharField(help_text="Base64 encoded user ID.")
    token = serializers.CharField(help_text="Password reset token.")

class GoogleAuthRequestSerializer(serializers.Serializer):
    code = serializers.CharField(help_text="Google OAuth2 authorization code.")

class GoogleAuthResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="JWT refresh token")
    access = serializers.CharField(help_text="JWT access token")
    user = UserViewResponseSerializer(help_text="Authenticated user details")
    is_new_user = serializers.BooleanField(required=False, help_text="Whether this is a newly created user")

class UpdateProfileRequestSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, help_text="First name")
    last_name = serializers.CharField(required=False, allow_blank=True, help_text="Last name")
    username = serializers.CharField(required=False, help_text="Username")
    email = serializers.EmailField(required=False, help_text="Email address")

class ChangePasswordRequestSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, help_text="Current password")
    new_password = serializers.CharField(write_only=True, help_text="New password")
    confirm_password = serializers.CharField(write_only=True, help_text="Confirm new password")

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match")
        return data

class VerifyEmailChangeRequestSerializer(serializers.Serializer):
    uid = serializers.CharField(help_text="Base64 encoded user ID")
    token = serializers.CharField(help_text="Email verification token")
    new_email = serializers.CharField(help_text="Base64 encoded new email address")
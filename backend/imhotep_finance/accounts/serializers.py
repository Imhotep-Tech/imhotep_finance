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


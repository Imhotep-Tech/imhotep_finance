from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies

class TransactionInputSerializer(serializers.Serializer):
    date_param = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Transaction date in YYYY-MM-DD format. Defaults to today if not provided."
    )
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=True,
        help_text="Transaction amount (must be greater than 0)"
    )
    currency = serializers.ChoiceField(
        choices=[(c, c) for c in get_allowed_currencies()],
        required=True,
        help_text="Currency code (e.g., USD, EUR)"
    )
    trans_details = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Optional transaction details/description"
    )
    category = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Transaction category (e.g., Food, Transport, Salary)"
    )
    trans_status = serializers.ChoiceField(
        choices=[
            ('Deposit', 'Deposit'),
            ('Withdraw', 'Withdraw'),
            ('deposit', 'deposit'),
            ('withdraw', 'withdraw'),
        ],
        required=True,
        help_text="Transaction type: Deposit or Withdraw"
    )

    def validate_amount(self, value):
        """Ensure amount is positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

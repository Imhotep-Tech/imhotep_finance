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

class TransactionDeleteResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(help_text="Whether the deletion was successful")
    message = serializers.CharField(help_text="Success message")
    networth = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Updated total networth across all currencies"
    )

class TransactionUpdateSerializer(serializers.Serializer):
    date = serializers.DateField(
        required=True,
        help_text="Transaction date in YYYY-MM-DD format"
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


class TransactionUpdateResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(help_text="Whether the update was successful")
    networth = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Updated total networth across all currencies"
    )

class TransactionFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Start date for filtering (YYYY-MM-DD). Defaults to first day of current month."
    )
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="End date for filtering (YYYY-MM-DD). Defaults to last day of current month."
    )
    category = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Filter by category"
    )
    trans_status = serializers.ChoiceField(
        choices=[
            ('Deposit', 'Deposit'),
            ('Withdraw', 'Withdraw'),
            ('deposit', 'deposit'),
            ('withdraw', 'withdraw'),
        ],
        required=False,
        allow_null=True,
        help_text="Filter by transaction status"
    )
    details_search = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Search in transaction details"
    )
    page = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        help_text="Page number for pagination"
    )


class TransactionOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    trans_status = serializers.CharField()
    trans_details = serializers.CharField(allow_null=True)
    category = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()


class TransactionListResponseSerializer(serializers.Serializer):
    transactions = TransactionOutputSerializer(many=True)
    pagination = serializers.DictField()
    date_range = serializers.DictField()

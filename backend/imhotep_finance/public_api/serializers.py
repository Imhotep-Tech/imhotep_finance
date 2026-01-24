from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies


class ExternalTransactionCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a transaction via the public API.
    """
    date = serializers.DateField(
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


class ExternalTransactionCreateResponseSerializer(serializers.Serializer):
    """
    Serializer for transaction creation response.
    """
    success = serializers.BooleanField(help_text="Whether the transaction was created successfully")
    message = serializers.CharField(help_text="Success message")
    transaction_id = serializers.IntegerField(help_text="ID of the created transaction")
    date = serializers.DateField(help_text="Transaction date")
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Transaction amount")
    currency = serializers.CharField(help_text="Currency code")
    trans_status = serializers.CharField(help_text="Transaction status (Deposit/Withdraw)")


class ExternalTransactionDeleteResponseSerializer(serializers.Serializer):
    """
    Serializer for transaction deletion response.
    """
    success = serializers.BooleanField(help_text="Whether the deletion was successful")
    message = serializers.CharField(help_text="Success message")


class ExternalTransactionListFilterSerializer(serializers.Serializer):
    """
    Serializer for filtering transaction list requests.
    """
    start_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Start date for filtering transactions (YYYY-MM-DD). Defaults to first day of current month."
    )
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="End date for filtering transactions (YYYY-MM-DD). Defaults to last day of current month."
    )
    category = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Filter by transaction category"
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
        help_text="Filter by transaction type"
    )
    page = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        help_text="Page number for pagination (default: 1)"
    )


class ExternalTransactionListItemSerializer(serializers.Serializer):
    """
    Serializer for individual transaction in list response.
    """
    id = serializers.IntegerField(help_text="Transaction ID")
    date = serializers.DateField(help_text="Transaction date")
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Transaction amount")
    currency = serializers.CharField(help_text="Currency code")
    trans_status = serializers.CharField(help_text="Transaction status (Deposit/Withdraw)")
    category = serializers.CharField(allow_null=True, help_text="Transaction category")
    trans_details = serializers.CharField(allow_null=True, help_text="Transaction details/description")


class ExternalTransactionListResponseSerializer(serializers.Serializer):
    """
    Serializer for transaction list response.
    """
    transactions = ExternalTransactionListItemSerializer(many=True, help_text="List of transactions")
    pagination = serializers.DictField(help_text="Pagination information")
    date_range = serializers.DictField(help_text="Date range used for filtering")

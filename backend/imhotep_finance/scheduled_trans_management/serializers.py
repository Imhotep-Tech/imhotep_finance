from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies


class ScheduledTransactionInputSerializer(serializers.Serializer):
    day_of_month = serializers.IntegerField(
        required=True,
        min_value=1,
        max_value=31,
        help_text="Day of the month (1-31) when transaction should occur"
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
    scheduled_trans_details = serializers.CharField(
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
        help_text="Transaction category"
    )
    scheduled_trans_status = serializers.ChoiceField(
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


class ScheduledTransactionFilterSerializer(serializers.Serializer):
    status = serializers.BooleanField(
        required=False,
        allow_null=True,
        help_text="Filter by active status (true/false)"
    )
    page = serializers.IntegerField(
        required=False,
        default=1,
        min_value=1,
        help_text="Page number for pagination"
    )


class ScheduledTransactionOutputSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    day_of_month = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    scheduled_trans_status = serializers.CharField()
    scheduled_trans_details = serializers.CharField(allow_null=True)
    category = serializers.CharField(allow_null=True)
    status = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class ScheduledTransactionListResponseSerializer(serializers.Serializer):
    scheduled_transactions = ScheduledTransactionOutputSerializer(many=True)
    pagination = serializers.DictField()

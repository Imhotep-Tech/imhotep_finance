from rest_framework import serializers


class MonthYearSerializer(serializers.Serializer):
    month = serializers.IntegerField(
        min_value=1,
        max_value=12,
        help_text="Month (1-12)"
    )
    year = serializers.IntegerField(
        min_value=2000,
        help_text="Year (e.g., 2024)"
    )


class ReportHistoryMonthsResponseSerializer(serializers.Serializer):
    report_history_months = MonthYearSerializer(many=True)


class MonthlyReportQuerySerializer(serializers.Serializer):
    month = serializers.IntegerField(
        required=True,
        min_value=1,
        max_value=12,
        help_text="Month (1-12)"
    )
    year = serializers.IntegerField(
        required=True,
        min_value=2000,
        help_text="Year (e.g., 2024)"
    )


class CategoryBreakdownSerializer(serializers.Serializer):
    category = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class ReportDataSerializer(serializers.Serializer):
    user_deposit_on_range = CategoryBreakdownSerializer(many=True)
    user_withdraw_on_range = CategoryBreakdownSerializer(many=True)
    total_deposits = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_withdrawals = serializers.DecimalField(max_digits=15, decimal_places=2)


class MonthlyReportResponseSerializer(serializers.Serializer):
    report_data = ReportDataSerializer()
    month = serializers.IntegerField()
    year = serializers.IntegerField()
    created_at = serializers.DateTimeField()


class YearQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(
        required=False,
        allow_null=True,  # Added
        min_value=1900,  # More lenient
        help_text="Year (e.g., 2024). Defaults to current year if not provided."
    )


class ReportHistoryYearsResponseSerializer(serializers.Serializer):
    report_history_years = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of years with available reports"
    )


class YearlyReportResponseSerializer(serializers.Serializer):
    user_withdraw_on_range = CategoryBreakdownSerializer(many=True)
    user_deposit_on_range = CategoryBreakdownSerializer(many=True)
    total_withdraw = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_deposit = serializers.DecimalField(max_digits=15, decimal_places=2)
    current_month = serializers.CharField()
    favorite_currency = serializers.CharField()
    year = serializers.IntegerField()
    months_included = serializers.IntegerField()


class ProcessedMonthSerializer(serializers.Serializer):
    month = serializers.IntegerField()
    year = serializers.IntegerField()
    month_name = serializers.CharField()
    total_transactions = serializers.IntegerField()
    total_withdraw = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_deposit = serializers.DecimalField(max_digits=15, decimal_places=2)
    status = serializers.CharField()


class RecalculateSummarySerializer(serializers.Serializer):
    total_months_processed = serializers.IntegerField()
    months_created = serializers.IntegerField()
    months_updated = serializers.IntegerField()
    errors_count = serializers.IntegerField()
    date_range = serializers.DictField()


class RecalculateReportsResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    summary = RecalculateSummarySerializer()
    processed_months = ProcessedMonthSerializer(many=True)
    errors = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True
    )

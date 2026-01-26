from rest_framework import serializers
from finance_management.utils.currencies import get_allowed_currencies
import csv
from io import TextIOWrapper, StringIO

class TransactionInputSerializer(serializers.Serializer):
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

class CSVFileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        required=True,
        help_text="CSV file with columns: date, amount, currency, trans_status, trans_details (optional), category (optional)"
    )
    
    def validate_file(self, file):
        """Validate the uploaded CSV file."""
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        
        # Validate file extension
        if not file.name.endswith('.csv'):
            raise serializers.ValidationError("Invalid file format. Please upload a CSV file.")
        
        # Validate file size
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("File size exceeds the maximum limit of 5MB.")
        
        # Validate file is not empty
        if file.size == 0:
            raise serializers.ValidationError("The uploaded file is empty.")
        
        # Validate file can be read as CSV
        try:
            # Read the file content
            file.seek(0)  # Ensure we're at the start
            file_content = file.read()
            
            # Decode and create file wrapper
            try:
                decoded_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                raise serializers.ValidationError("Unable to read file. Please ensure the file is UTF-8 encoded.")
            
            # Parse as CSV
            file_wrapper = StringIO(decoded_content)
            csv_reader = csv.DictReader(file_wrapper)
            
            # Validate headers
            required_columns = {'date', 'amount', 'currency', 'trans_status'}
            if csv_reader.fieldnames is None:
                raise serializers.ValidationError("CSV file appears to be empty or has no headers.")
            
            normalized_headers = {h.strip().lower() for h in csv_reader.fieldnames if h}
            missing_columns = required_columns - normalized_headers
            
            if missing_columns:
                raise serializers.ValidationError(
                    f"Missing required columns: {', '.join(missing_columns)}. "
                    "Required columns are: date, amount, currency, trans_status."
                )
            
            # Reset file pointer for later processing
            file.seek(0)
            
        except csv.Error as e:
            raise serializers.ValidationError(f"Invalid CSV file format: {str(e)}")
        
        return file


class TransactionImportResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(help_text="Whether any transactions were imported")
    message = serializers.CharField(help_text="Summary message")
    imported_count = serializers.IntegerField(help_text="Number of transactions successfully imported")
    errors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of errors encountered during import"
    )

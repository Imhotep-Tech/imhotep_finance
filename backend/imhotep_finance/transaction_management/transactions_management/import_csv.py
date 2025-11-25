import csv
from io import TextIOWrapper
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .schemas.transaction_schemas import import_csv_response
from .utils.create_transaction import create_transaction


@swagger_auto_schema(
    method='post',
    operation_description='Import user transactions from a CSV file. Required columns: date, amount, currency, trans_status. Optional columns: trans_details, category.',
    consumes=['multipart/form-data'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['file'],
        properties={
            'file': openapi.Schema(
                type=openapi.TYPE_FILE,
                description='CSV file with columns: date, amount, currency, trans_status, trans_details (optional), category (optional)'
            )
        },
    ),
    responses={
        200: import_csv_response,
        400: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'error': openapi.Schema(type=openapi.TYPE_STRING, example='Invalid file format. Please upload a CSV file.'),
            }
        ),
        500: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'error': openapi.Schema(type=openapi.TYPE_STRING, example='Error occurred while importing transactions'),
            }
        ),
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def import_transactions_csv(request):
    """Import transactions from a CSV file for the logged-in user."""
    try:
        user = request.user

        # Check if file is provided
        if 'file' not in request.FILES:
            return Response(
                {'error': "No file provided. Please upload a CSV file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']

        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        MAX_ROWS = 1000

        # Validate file extension
        if not file.name.endswith('.csv'):
            return Response(
                {'error': "Invalid file format. Please upload a CSV file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size
        if file.size > MAX_FILE_SIZE:
            return Response(
                {'error': "File size exceeds the maximum limit of 5MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file is not empty
        if file.size == 0:
            return Response(
                {'error': "The uploaded file is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Read CSV file
        try:
            file_wrapper = TextIOWrapper(file.file, encoding='utf-8')
            csv_reader = csv.DictReader(file_wrapper)
        except UnicodeDecodeError:
            return Response(
                {'error': "Unable to read file. Please ensure the file is UTF-8 encoded."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate required headers
        required_columns = {'date', 'amount', 'currency', 'trans_status'}
        if csv_reader.fieldnames is None:
            return Response(
                {'error': "CSV file appears to be empty or has no headers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalize header names (strip whitespace, lowercase)
        normalized_headers = {h.strip().lower(): h for h in csv_reader.fieldnames if h}
        missing_columns = required_columns - set(normalized_headers.keys())

        if missing_columns:
            return Response(
                {'error': f"Missing required columns: {', '.join(missing_columns)}. Required columns are: date, amount, currency, trans_status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_count = 0
        errors = []
        row_count = 0

        for row_num, row in enumerate(csv_reader, start=2):
            row_count += 1
            
            # Check row limit
            if row_count > MAX_ROWS:
                errors.append(f"Row limit exceeded. Only the first {MAX_ROWS} rows were processed.")
                break

            try:
                # Normalize row keys
                normalized_row = {k.strip().lower(): v.strip() if v else '' for k, v in row.items() if k}

                # Extract values
                date_val = normalized_row.get('date', '')
                amount_str = normalized_row.get('amount', '')
                currency_val = normalized_row.get('currency', '')
                trans_status_val = normalized_row.get('trans_status', '')
                trans_details = normalized_row.get('trans_details', '')
                category = normalized_row.get('category', '')

                # Validate required fields
                if not date_val:
                    errors.append(f"Row {row_num}: Missing required field 'date'.")
                    continue

                if not amount_str:
                    errors.append(f"Row {row_num}: Missing required field 'amount'.")
                    continue

                if not currency_val:
                    errors.append(f"Row {row_num}: Missing required field 'currency'.")
                    continue

                if not trans_status_val:
                    errors.append(f"Row {row_num}: Missing required field 'trans_status'.")
                    continue

                # Validate amount is a number
                try:
                    amount = float(amount_str)
                    if amount <= 0:
                        errors.append(f"Row {row_num}: Amount must be a positive number.")
                        continue
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid amount '{amount_str}'. Must be a number.")
                    continue

                # Validate trans_status
                trans_status_lower = trans_status_val.lower()
                if trans_status_lower not in ['deposit', 'withdraw']:
                    errors.append(f"Row {row_num}: Invalid trans_status '{trans_status_val}'. Must be 'deposit' or 'withdraw'.")
                    continue

                # Create the transaction
                trans, error = create_transaction(
                    request, user, date_val, amount, currency_val, trans_details, category, trans_status_lower
                )

                if error:
                    error_msg = error.get("message", "Unknown error")
                    errors.append(f"Row {row_num}: {error_msg}")
                else:
                    created_count += 1

            except Exception as e:
                errors.append(f"Row {row_num}: Error processing row - {str(e)}")

        # Prepare response
        response_data = {
            'success': created_count > 0,
            'message': f"Successfully imported {created_count} transaction(s).",
            'imported_count': created_count,
        }

        if errors:
            response_data['errors'] = errors[:50]  # Limit to first 50 errors
            if len(errors) > 50:
                response_data['errors'].append(f"... and {len(errors) - 50} more errors.")
            
            if created_count == 0:
                response_data['message'] = "No transactions were imported due to errors."

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f"Error occurred while importing transactions: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
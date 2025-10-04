import csv
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..models import Transactions
from datetime import datetime, date
import calendar

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_transactions_csv(request):
    # Export transactions as a CSV file for the logged-in user.
    try:
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        today = date.today()
        if not start_date:
            start_date = today.replace(day=1)
        else:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if not end_date:
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_date = today.replace(day=last_day)
        else:
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Filter transactions by user and date range
        transactions = Transactions.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('-date')

        # Create the HTTP response with CSV content
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="transactions_{start_date}_to_{end_date}.csv"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        # Write CSV data
        writer = csv.writer(response)
        writer.writerow(['Date', 'Amount', 'Currency', 'Status', 'Category', 'Details'])  # CSV Header
        for transaction in transactions:
            writer.writerow([
                transaction.date,
                transaction.amount,
                transaction.currency,
                transaction.trans_status,
                transaction.category,
                transaction.trans_details
            ])
        
        return response
    except Exception as e:
        return HttpResponse(f"Error occurred while exporting transactions", status=500)
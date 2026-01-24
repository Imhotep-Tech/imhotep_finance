from django.core.exceptions import ValidationError
from user_reports.models import Reports
from datetime import date
import calendar
import json
from transaction_management.models import Transactions
from .utils.calculate_user_report import calculate_user_report
from .utils.save_user_report import save_user_report

def get_report_history_months_for_user(*, user):
    """Get available report months/years for a user."""
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    # Use distinct on specific fields for better performance
    report_history = Reports.objects.filter(
        user=user
    ).values('month', 'year').distinct().order_by('-year', '-month')
    
    return list(report_history)


def get_monthly_report_for_user(*, user, month, year):
    """Get a specific monthly report for a user."""
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    if not month or not year:
        raise ValidationError("Month and year are required")
    
    try:
        month = int(month)
        year = int(year)
    except (ValueError, TypeError):
        raise ValidationError("Month and year must be valid integers")
    
    if month < 1 or month > 12:
        raise ValidationError("Month must be between 1 and 12")
    
    # Get report from database
    user_report = Reports.objects.filter(user=user, month=month, year=year).first()
    
    if not user_report:
        raise ValidationError("No report found for the specified month and year")
    
    # Calculate and save report data if it doesn't exist or is empty
    if not user_report.data or user_report.data.strip() in ['{}', '']:
        try:
            # Create date objects for the first and last day of the month
            start_date = date(year, month, 1)
            last_day = calendar.monthrange(year, month)[1]
            end_date = date(year, month, last_day)
            
            # Calculate report data
            user_withdraw_on_range, user_deposit_on_range, total_withdraw, total_deposit = calculate_user_report(start_date, end_date, user)
            
            # Format the response data
            month_name = calendar.month_name[month]
            response_data = {
                "user_withdraw_on_range": user_withdraw_on_range,
                "user_deposit_on_range": user_deposit_on_range,
                "total_withdraw": float(total_withdraw) if total_withdraw is not None else 0.0,
                "total_deposit": float(total_deposit) if total_deposit is not None else 0.0,
                "current_month": f"{month_name} {year}",
                "favorite_currency": user.favorite_currency or 'USD'
            }
            
            # Save the report
            success, result = save_user_report(user, start_date, response_data)
            if not success:
                raise ValidationError(f"Error saving report: {result}")
            
            # Refresh the report from database
            user_report.refresh_from_db()
        except Exception as e:
            raise ValidationError(f"Error calculating report: {str(e)}")
    
    # Parse encrypted data if it's a string (EncryptedTextField returns decrypted string)
    report_data = user_report.data
    if isinstance(report_data, str):
        try:
            report_data = json.loads(report_data)
        except json.JSONDecodeError:
            raise ValidationError("Error parsing report data")
    
    # Sort the data by percentage in descending order
    if isinstance(report_data, dict):
        if 'user_deposit_on_range' in report_data and isinstance(report_data['user_deposit_on_range'], list):
            report_data['user_deposit_on_range'] = sorted(
                report_data['user_deposit_on_range'],
                key=lambda x: x.get('percentage', 0),
                reverse=True
            )
        if 'user_withdraw_on_range' in report_data and isinstance(report_data['user_withdraw_on_range'], list):
            report_data['user_withdraw_on_range'] = sorted(
                report_data['user_withdraw_on_range'],
                key=lambda x: x.get('percentage', 0),
                reverse=True
            )

    return {
        "report_data": report_data,
        "month": user_report.month,
        "year": user_report.year,
        "created_at": user_report.created_at
    }


def get_report_history_years_for_user(*, user):
    """Get available report years for a user."""
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    # Get distinct years from user reports
    report_history = Reports.objects.filter(
        user=user
    ).values('year').distinct().order_by('-year')
    
    return [item['year'] for item in report_history]


def get_yearly_report_for_user(*, user, year=None):
    """Get aggregated yearly report for a user."""
    from django.utils import timezone
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    now = timezone.now()
    
    if year is not None:  # Changed condition
        try:
            year = int(year)
        except (ValueError, TypeError):
            raise ValidationError("Year must be a valid integer")
    else:
        year = now.year
    
    # Get all monthly reports for the specified year
    monthly_reports = Reports.objects.filter(user=user, year=year).order_by('month')
    
    if not monthly_reports.exists():
        raise ValidationError(f"No reports found for year {year}")
    
    # Aggregate data from all monthly reports
    total_withdraw = 0.0
    total_deposit = 0.0
    withdraw_categories = {}
    deposit_categories = {}
    
    for monthly_report in monthly_reports:
        data = monthly_report.data
        
        # Parse encrypted data if it's a string (EncryptedTextField returns decrypted string)
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                continue  # Skip this report if data can't be parsed
        
        # Add to yearly totals
        total_withdraw += data.get('total_withdraw', 0)
        total_deposit += data.get('total_deposit', 0)
        
        # Aggregate withdraw categories
        for item in data.get('user_withdraw_on_range', []):
            category = item['category']
            amount = item['converted_amount']
            withdraw_categories[category] = withdraw_categories.get(category, 0) + amount
        
        # Aggregate deposit categories
        for item in data.get('user_deposit_on_range', []):
            category = item['category']
            amount = item['converted_amount']
            deposit_categories[category] = deposit_categories.get(category, 0) + amount
    
    # Convert category dictionaries to lists with percentages
    user_withdraw_on_range = []
    if total_withdraw > 0:
        for category, amount in withdraw_categories.items():
            percentage = round((amount / total_withdraw) * 100, 1)
            user_withdraw_on_range.append({
                "category": category,
                "converted_amount": float(amount),
                "percentage": percentage
            })
        user_withdraw_on_range.sort(key=lambda x: x['percentage'], reverse=True)
    
    user_deposit_on_range = []
    if total_deposit > 0:
        for category, amount in deposit_categories.items():
            percentage = round((amount / total_deposit) * 100, 1)
            user_deposit_on_range.append({
                "category": category,
                "converted_amount": float(amount),
                "percentage": percentage
            })
        user_deposit_on_range.sort(key=lambda x: x['percentage'], reverse=True)
    
    return {
        "user_withdraw_on_range": user_withdraw_on_range,
        "user_deposit_on_range": user_deposit_on_range,
        "total_withdraw": float(total_withdraw),
        "total_deposit": float(total_deposit),
        "current_month": f"Year {year}",
        "favorite_currency": user.favorite_currency or 'USD',
        "year": year,
        "months_included": monthly_reports.count()
    }


def recalculate_all_reports_for_user(*, user):
    """Recalculate all monthly reports for a user from first to last transaction."""
    
    if not user:
        raise ValidationError("User must be authenticated!")
    
    # Get the date range of all user transactions
    transaction_dates = Transactions.objects.filter(user=user).values_list('date', flat=True).order_by('date')
    
    if not transaction_dates:
        return {
            'message': 'No transactions found for this user',
            'summary': {
                'total_months_processed': 0,
                'months_created': 0,
                'months_updated': 0,
                'errors_count': 0
            }
        }
    
    first_date = transaction_dates.first()
    last_date = transaction_dates.last()
    
    # Generate all months between first and last transaction
    current_date = date(first_date.year, first_date.month, 1)
    end_date = date(last_date.year, last_date.month, 1)
    
    processed_months = []
    total_created = 0
    total_updated = 0
    errors = []
    
    while current_date <= end_date:
        try:
            # Calculate first and last day of current month
            first_day = current_date
            last_day_of_month = calendar.monthrange(current_date.year, current_date.month)[1]
            last_day = date(current_date.year, current_date.month, last_day_of_month)
            
            # Calculate report data for this month - FIXED: only 3 arguments
            (
                user_withdraw_on_range,
                user_deposit_on_range,
                total_withdraw,
                total_deposit,
            ) = calculate_user_report(first_day, last_day, user)  # Removed None argument
            
            # Prepare response data structure
            month_name = calendar.month_name[current_date.month]
            response_data = {
                "user_withdraw_on_range": [
                    {
                        "category": item['category'],
                        "converted_amount": float(item['converted_amount']),
                        "percentage": float(item.get('percentage', 0))
                    }
                    for item in user_withdraw_on_range
                ],
                "user_deposit_on_range": [
                    {
                        "category": item['category'],
                        "converted_amount": float(item['converted_amount']),
                        "percentage": float(item.get('percentage', 0))
                    }
                    for item in user_deposit_on_range
                ],
                "total_withdraw": float(total_withdraw) if total_withdraw is not None else 0.0,
                "total_deposit": float(total_deposit) if total_deposit is not None else 0.0,
                "current_month": f"{month_name} {current_date.year}",
                "favorite_currency": user.favorite_currency or 'USD',
                "start_date": first_day.isoformat(),
                "end_date": last_day.isoformat()
            }
            
            # Save the report for this month
            success, result = save_user_report(user, first_day, response_data)
            
            if success:
                if result == "created":
                    total_created += 1
                    status_text = 'created'
                else:
                    total_updated += 1
                    status_text = 'updated'
                
                processed_months.append({
                    'month': current_date.month,
                    'year': current_date.year,
                    'month_name': f"{month_name} {current_date.year}",
                    'total_transactions': len(user_withdraw_on_range) + len(user_deposit_on_range),
                    'total_withdraw': float(total_withdraw) if total_withdraw else 0.0,
                    'total_deposit': float(total_deposit) if total_deposit else 0.0,
                    'status': status_text
                })
            else:
                errors.append({
                    'month': f"{month_name} {current_date.year}",
                    'error': result
                })
            
        except Exception as month_error:
            print(f"Error processing {calendar.month_name[current_date.month]} {current_date.year}: {str(month_error)}")
            errors.append({
                'month': f"{calendar.month_name[current_date.month]} {current_date.year}",
                'error': str(month_error)
            })
        
        # Move to next month
        if current_date.month == 12:
            current_date = date(current_date.year + 1, 1, 1)
        else:
            current_date = date(current_date.year, current_date.month + 1, 1)
    
    return {
        'message': 'Report recalculation completed',
        'summary': {
            'total_months_processed': total_created + total_updated,
            'months_created': total_created,
            'months_updated': total_updated,
            'errors_count': len(errors),
            'date_range': {
                'from': f"{calendar.month_name[first_date.month]} {first_date.year}",
                'to': f"{calendar.month_name[last_date.month]} {last_date.year}"
            }
        },
        'processed_months': processed_months,
        'errors': errors if errors else None
    }

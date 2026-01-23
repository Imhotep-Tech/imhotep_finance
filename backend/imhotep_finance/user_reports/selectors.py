from user_reports.models import Reports


def get_reports_for_user(*, user):
    """Get all reports for a user ordered by date."""
    return Reports.objects.filter(user=user).order_by('-year', '-month')


def check_report_exists(*, user, month, year):
    """Check if a report exists for a specific month and year."""
    return Reports.objects.filter(user=user, month=month, year=year).exists()

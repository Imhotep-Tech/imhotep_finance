from ...models import Reports
def save_user_report(user, start_date, response_data):
    if not user or not start_date or not response_data:
        return False, "Invalid parameters"
    
    # Check if a report for the same month and year already exists
    try:
        user_report = Reports.objects.filter(user=user, month=start_date.month, year=start_date.year).first()
        if user_report:
            if user_report.data != response_data:
                user_report.data = response_data
                user_report.save()
            return True, None  # Report already exists, no need to save again
    except Exception as e:
        return False, str(e)
    
    # Create and save a new report if it doesn't exist for this month and year
    try:
        user_report = Reports.objects.create(
            user=user,
            month=start_date.month,
            year=start_date.year,
            data=response_data
            )
        user_report.save()
        return True, None
    except Exception as e:
        return False, str(e)

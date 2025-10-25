from django.urls import path
from .user_reports import get_monthly_report, get_yearly_report, get_monthly_report_history, recalculate_user_reports

urlpatterns = [
    #monthly report
    path('get-monthly-report/', get_monthly_report.get_monthly_reports, name='get_monthly_reports'),
    path('get-monthly-report-history/', get_monthly_report_history.get_monthly_report_history, name='get_monthly_report_history'),
    path('get-report-history-months/', get_monthly_report_history.get_report_history_months, name='get_report_history_months'),
    path('recalculate-reports/', recalculate_user_reports.recalculate_reports, name='recalculate_reports'),
    
    #yearly report
    path('get-yearly-report/', get_yearly_report.get_yearly_reports, name='get_yearly_reports'),
    path('get-report-history-years/', get_yearly_report.get_report_history_years, name='get_report_history_years'),

]
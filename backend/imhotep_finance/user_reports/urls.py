from django.urls import path
from .apis import (
    ReportHistoryMonthsApi,
    MonthlyReportHistoryApi,
    ReportHistoryYearsApi,
    YearlyReportApi,
    RecalculateReportsApi
)

urlpatterns = [
    path('get-report-history-months/', ReportHistoryMonthsApi.as_view(), name='report_history_months'),
    path('get-monthly-report-history/', MonthlyReportHistoryApi.as_view(), name='monthly_report_history'),
    path('get-report-history-years/', ReportHistoryYearsApi.as_view(), name='report_history_years'),
    path('get-yearly-report/', YearlyReportApi.as_view(), name='yearly_report'),
    path('recalculate-reports/', RecalculateReportsApi.as_view(), name='recalculate_reports'),
]
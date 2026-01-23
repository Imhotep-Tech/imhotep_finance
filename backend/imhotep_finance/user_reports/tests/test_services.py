from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date
from user_reports.services import (
    get_report_history_months_for_user,
    get_monthly_report_for_user,
    get_report_history_years_for_user,
    get_yearly_report_for_user,
    recalculate_all_reports_for_user
)
from user_reports.models import Reports
from transaction_management.services import create_transaction
from transaction_management.models import NetWorth

User = get_user_model()


class GetReportHistoryMonthsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_get_report_history_months_success(self):
        """Test getting report history months"""
        # Create reports for different months
        Reports.objects.create(user=self.user, month=1, year=2024, data={})
        Reports.objects.create(user=self.user, month=2, year=2024, data={})
        
        result = get_report_history_months_for_user(user=self.user)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['month'], 2)  # Most recent first
    
    def test_get_report_history_months_no_user(self):
        """Test getting report history without user"""
        with self.assertRaises(ValidationError):
            get_report_history_months_for_user(user=None)


class GetMonthlyReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.report = Reports.objects.create(
            user=self.user,
            month=1,
            year=2024,
            data={
                'user_deposit_on_range': [
                    {'category': 'Salary', 'converted_amount': 1000, 'percentage': 100}
                ],
                'user_withdraw_on_range': [],
                'total_deposit': 1000,
                'total_withdraw': 0
            }
        )
    
    def test_get_monthly_report_success(self):
        """Test getting monthly report"""
        result = get_monthly_report_for_user(user=self.user, month=1, year=2024)
        
        self.assertEqual(result['month'], 1)
        self.assertEqual(result['year'], 2024)
        self.assertIn('report_data', result)
    
    def test_get_monthly_report_not_found(self):
        """Test getting non-existent monthly report"""
        with self.assertRaises(ValidationError) as context:
            get_monthly_report_for_user(user=self.user, month=12, year=2023)
        # Check if error message contains "not found"
        error_message = str(context.exception)
        self.assertTrue('not found' in error_message.lower() or 'no report' in error_message.lower())


class GetReportHistoryYearsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_get_report_history_years_success(self):
        """Test getting report history years"""
        Reports.objects.create(user=self.user, month=1, year=2023, data={})
        Reports.objects.create(user=self.user, month=1, year=2024, data={})
        
        result = get_report_history_years_for_user(user=self.user)
        
        self.assertEqual(len(result), 2)
        self.assertIn(2023, result)
        self.assertIn(2024, result)


class GetYearlyReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        
        # Create monthly reports for 2024
        for month in range(1, 4):
            Reports.objects.create(
                user=self.user,
                month=month,
                year=2024,
                data={
                    'user_deposit_on_range': [
                        {'category': 'Salary', 'converted_amount': 1000, 'percentage': 100}
                    ],
                    'user_withdraw_on_range': [
                        {'category': 'Rent', 'converted_amount': 500, 'percentage': 100}
                    ],
                    'total_deposit': 1000,
                    'total_withdraw': 500
                }
            )
    
    def test_get_yearly_report_success(self):
        """Test getting yearly report"""
        result = get_yearly_report_for_user(user=self.user, year=2024)
        
        self.assertEqual(result['year'], 2024)
        self.assertEqual(result['months_included'], 3)
        self.assertEqual(result['total_deposit'], 3000)  # 1000 * 3
        self.assertEqual(result['total_withdraw'], 1500)  # 500 * 3
    
    def test_get_yearly_report_no_data(self):
        """Test getting yearly report with no data"""
        with self.assertRaises(ValidationError) as context:
            get_yearly_report_for_user(user=self.user, year=2023)
        # Check if error message contains "not found"
        error_message = str(context.exception)
        self.assertTrue('not found' in error_message.lower() or 'no reports' in error_message.lower())


class RecalculateAllReportsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        NetWorth.objects.create(user=self.user, currency='USD', total=0)
    
    def test_recalculate_no_transactions(self):
        """Test recalculate with no transactions"""
        result = recalculate_all_reports_for_user(user=self.user)
        
        self.assertIn('message', result)
        self.assertEqual(result['summary']['total_months_processed'], 0)
    
    def test_recalculate_with_transactions(self):
        """Test recalculate with transactions"""
        # Create transactions
        create_transaction(
            user=self.user,
            amount=1000,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Test',
            transaction_date=date(2024, 1, 15)
        )
        
        result = recalculate_all_reports_for_user(user=self.user)
        
        self.assertTrue(result['summary']['total_months_processed'] >= 1)
        self.assertIn('processed_months', result)

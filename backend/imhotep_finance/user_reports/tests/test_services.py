from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date
import json
from user_reports.services import get_report_history_months_for_user, get_monthly_report_for_user, get_report_history_years_for_user, get_yearly_report_for_user, recalculate_all_reports_for_user
from user_reports.models import Reports
from transaction_management.services import create_transaction
from transaction_management.models import NetWorth
User = get_user_model()

class GetReportHistoryMonthsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_get_report_history_months_success(self):
        """Test getting report history months"""
        Reports.objects.create(user=self.user, month=1, year=2024, data=json.dumps({}))
        Reports.objects.create(user=self.user, month=2, year=2024, data=json.dumps({}))
        result = get_report_history_months_for_user(user=self.user)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['month'], 2)

    def test_get_report_history_months_no_user(self):
        """Test getting report history without user"""
        with self.assertRaises(ValidationError):
            get_report_history_months_for_user(user=None)

class GetMonthlyReportTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.report = Reports.objects.create(user=self.user, month=1, year=2024, data=json.dumps({'user_deposit_on_range': [{'category': 'Salary', 'converted_amount': 1000, 'percentage': 100}], 'user_withdraw_on_range': [], 'total_deposit': 1000, 'total_withdraw': 0}))

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
        error_message = str(context.exception)
        self.assertTrue('not found' in error_message.lower() or 'no report' in error_message.lower())

class GetReportHistoryYearsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_get_report_history_years_success(self):
        """Test getting report history years"""
        Reports.objects.create(user=self.user, month=1, year=2023, data=json.dumps({}))
        Reports.objects.create(user=self.user, month=1, year=2024, data=json.dumps({}))
        result = get_report_history_years_for_user(user=self.user)
        self.assertEqual(len(result), 2)
        self.assertIn(2023, result)
        self.assertIn(2024, result)

class GetYearlyReportTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        for month in range(1, 4):
            Reports.objects.create(user=self.user, month=month, year=2024, data=json.dumps({'user_deposit_on_range': [{'category': 'Salary', 'converted_amount': 1000, 'percentage': 100}], 'user_withdraw_on_range': [{'category': 'Rent', 'converted_amount': 500, 'percentage': 100}], 'total_deposit': 1000, 'total_withdraw': 500}))

    def test_get_yearly_report_success(self):
        """Test getting yearly report"""
        result = get_yearly_report_for_user(user=self.user, year=2024)
        self.assertEqual(result['year'], 2024)
        self.assertEqual(result['months_included'], 3)
        self.assertEqual(result['total_deposit'], 3000)
        self.assertEqual(result['total_withdraw'], 1500)

    def test_get_yearly_report_no_data(self):
        """Test getting yearly report with no data"""
        with self.assertRaises(ValidationError) as context:
            get_yearly_report_for_user(user=self.user, year=2023)
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
        create_transaction(user=self.user, amount=1000, currency='USD', trans_status='deposit', category='Salary', trans_details='Test', transaction_date=date(2024, 1, 15), place='General')
        result = recalculate_all_reports_for_user(user=self.user)
        self.assertTrue(result['summary']['total_months_processed'] >= 1)
        self.assertIn('processed_months', result)

    def test_recalculate_excludes_transfer_and_conversion(self):
        """Test recalculating reports excludes Transfer and Conversion categories"""
        # Create normal transaction
        create_transaction(user=self.user, amount=1000, currency='USD', trans_status='deposit', category='Salary', trans_details='Test Salary', transaction_date=date(2024, 1, 15), place='General')
        # Create transfer transaction
        create_transaction(user=self.user, amount=500, currency='USD', trans_status='withdraw', category='Transfer', trans_details='Test Transfer', transaction_date=date(2024, 1, 20), place='General')
        # Create conversion transaction
        create_transaction(user=self.user, amount=200, currency='USD', trans_status='deposit', category='Conversion', trans_details='Test Conversion', transaction_date=date(2024, 1, 25), place='General')
        
        # Recalculate
        result = recalculate_all_reports_for_user(user=self.user)
        self.assertTrue(result['summary']['total_months_processed'] >= 1)
        
        # Get the monthly report
        report = get_monthly_report_for_user(user=self.user, month=1, year=2024)
        report_data = report['report_data']
        
        # The totals should only include 'Salary'
        self.assertEqual(report_data['total_deposit'], 1000.0)
        self.assertEqual(report_data['total_withdraw'], 0.0)
        
        # Breakdown should only have 'Salary'
        categories_deposit = [item['category'] for item in report_data['user_deposit_on_range']]
        self.assertIn('Salary', categories_deposit)
        self.assertNotIn('Conversion', categories_deposit)
        
        categories_withdraw = [item['category'] for item in report_data['user_withdraw_on_range']]
        self.assertNotIn('Transfer', categories_withdraw)
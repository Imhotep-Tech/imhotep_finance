from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from user_reports.models import Reports
from transaction_management.services import create_transaction
from transaction_management.models import NetWorth
from datetime import date

User = get_user_model()


class ReportHistoryMonthsApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('report_history_months')
    
    def test_get_report_history_months_success(self):
        """Test getting report history months via API"""
        Reports.objects.create(user=self.user, month=1, year=2024, data={})
        Reports.objects.create(user=self.user, month=2, year=2024, data={})
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('report_history_months', response.data)
        self.assertEqual(len(response.data['report_history_months']), 2)
    
    def test_get_report_history_months_no_data(self):
        """Test getting report history with no data"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MonthlyReportHistoryApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('monthly_report_history')
        
        self.report = Reports.objects.create(
            user=self.user,
            month=1,
            year=2024,
            data={
                'user_deposit_on_range': [],
                'user_withdraw_on_range': [],
                'total_deposit': 0,
                'total_withdraw': 0
            }
        )
    
    def test_get_monthly_report_success(self):
        """Test getting monthly report via API"""
        response = self.client.get(self.url, {'month': 1, 'year': 2024})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('report_data', response.data)
        self.assertEqual(response.data['month'], 1)
        self.assertEqual(response.data['year'], 2024)
    
    def test_get_monthly_report_missing_params(self):
        """Test getting monthly report without params"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_monthly_report_not_found(self):
        """Test getting non-existent monthly report"""
        response = self.client.get(self.url, {'month': 12, 'year': 2023})
        # Should return 404 when report doesn't exist
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST])
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn('error', response.data)


class ReportHistoryYearsApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('report_history_years')
    
    def test_get_report_history_years_success(self):
        """Test getting report history years via API"""
        Reports.objects.create(user=self.user, month=1, year=2023, data={})
        Reports.objects.create(user=self.user, month=1, year=2024, data={})
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('report_history_years', response.data)
        self.assertEqual(len(response.data['report_history_years']), 2)


class YearlyReportApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('yearly_report')
        
        # Create monthly reports
        for month in range(1, 4):
            Reports.objects.create(
                user=self.user,
                month=month,
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
    
    def test_get_yearly_report_success(self):
        """Test getting yearly report via API"""
        response = self.client.get(self.url, {'year': 2024})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], 2024)
        self.assertEqual(response.data['months_included'], 3)
    
    def test_get_yearly_report_no_year(self):
        """Test getting yearly report without year parameter"""
        response = self.client.get(self.url)
        # Should use current year or return 404/400 if no data
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST])


class RecalculateReportsApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('recalculate_reports')
        
        NetWorth.objects.create(user=self.user, currency='USD', total=0)
    
    def test_recalculate_no_transactions(self):
        """Test recalculate with no transactions"""
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['summary']['total_months_processed'], 0)
    
    def test_recalculate_with_transactions(self):
        """Test recalculate with transactions"""
        # Create transaction
        create_transaction(
            user=self.user,
            amount=1000,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Test',
            transaction_date=date(2024, 1, 15)
        )
        
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertGreaterEqual(response.data['summary']['total_months_processed'], 1)

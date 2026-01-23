from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from user_reports.services import recalculate_all_reports_for_user, get_yearly_report_for_user
from transaction_management.services import create_transaction
from transaction_management.models import NetWorth
from user_reports.models import Reports
from datetime import date

User = get_user_model()


class ReportsIntegrationTest(TransactionTestCase):
    """Integration tests for reports with transactions"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        NetWorth.objects.create(user=self.user, currency='USD', total=0)
    
    def test_complete_report_lifecycle(self):
        """Test complete report generation from transactions"""
        # Create transactions across multiple months
        create_transaction(
            user=self.user,
            amount=1000,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Jan salary',
            transaction_date=date(2024, 1, 15)
        )
        
        create_transaction(
            user=self.user,
            amount=500,
            currency='USD',
            trans_status='withdraw',
            category='Rent',
            trans_details='Jan rent',
            transaction_date=date(2024, 1, 20)
        )
        
        create_transaction(
            user=self.user,
            amount=1000,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Feb salary',
            transaction_date=date(2024, 2, 15)
        )
        
        # Recalculate all reports
        result = recalculate_all_reports_for_user(user=self.user)
        
        # Verify reports were created
        self.assertGreaterEqual(result['summary']['total_months_processed'], 2)
        
        # Verify monthly reports exist
        jan_report = Reports.objects.filter(user=self.user, month=1, year=2024).first()
        self.assertIsNotNone(jan_report)
        self.assertIn('total_deposit', jan_report.data)
        self.assertIn('total_withdraw', jan_report.data)
        
        # Verify yearly report aggregation
        yearly_report = get_yearly_report_for_user(user=self.user, year=2024)
        self.assertEqual(yearly_report['year'], 2024)
        self.assertGreaterEqual(yearly_report['months_included'], 2)

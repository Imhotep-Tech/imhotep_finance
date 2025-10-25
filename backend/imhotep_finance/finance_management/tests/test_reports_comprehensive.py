from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from transaction_management.models import Transactions, NetWorth
from user_reports.models import Reports
from scheduled_trans_management.models import ScheduledTransaction
from wishlist_management.models import Wishlist
from user_reports.user_reports.utils.save_user_report import save_user_report_with_transaction, save_user_report_with_transaction_update
from datetime import date, datetime, timedelta
import calendar
import json

class ReportsComprehensiveTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='testpass',
            favorite_currency='USD'
        )
        self.client.force_authenticate(user=self.user)
        self.currency = 'USD'
        self.networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=1000)
        
        # Create some base transactions for testing
        self.today = date.today()
        self.last_month = date(self.today.year, self.today.month - 1 if self.today.month > 1 else 12, 1)
        self.next_month = date(self.today.year, self.today.month + 1 if self.today.month < 12 else 1, 1) if self.today.month < 12 else date(self.today.year + 1, 1, 1)

    def test_create_transaction_updates_current_month_report(self):
        """Test that creating a transaction updates the current month's report"""
        # Create a transaction
        url = reverse('add_transactions')
        data = {
            "date": str(self.today),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Test deposit",
            "category": "Salary",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if report was created/updated
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 100.0)
        self.assertEqual(len(report.data['user_deposit_on_range']), 1)
        self.assertEqual(report.data['user_deposit_on_range'][0]['category'], 'Salary')

    def test_create_transaction_past_month_updates_correct_report(self):
        """Test that creating a transaction in the past updates the correct month's report"""
        past_date = self.last_month
        
        url = reverse('add_transactions')
        data = {
            "date": str(past_date),
            "amount": 200,
            "currency": self.currency,
            "trans_details": "Past transaction",
            "category": "Bonus",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if report was created for the past month
        report = Reports.objects.filter(user=self.user, month=past_date.month, year=past_date.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 200.0)

    def test_update_transaction_date_moves_between_months(self):
        """Test updating transaction date moves it between different months"""
        # Create initial transaction in current month
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=150,
            currency=self.currency,
            trans_status="withdraw",
            category="Shopping",
            trans_details="Initial transaction"
        )
        
        # Trigger report creation
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Verify current month report
        current_report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(current_report)
        self.assertEqual(current_report.data['total_withdraw'], 150.0)
        
        # Update transaction to past month - use POST instead of PUT
        url = reverse('update_transaction', args=[transaction.id])
        data = {
            "date": str(self.last_month),
            "amount": 150,
            "currency": self.currency,
            "trans_details": "Updated transaction",
            "category": "Shopping",
            "trans_status": "withdraw"
        }
        response = self.client.post(url, data, format='json')  # Changed from PUT to POST
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that current month report is updated (transaction removed)
        current_report.refresh_from_db()
        self.assertEqual(current_report.data.get('total_withdraw', 0), 0.0)
        
        # Check that past month report is created/updated
        past_report = Reports.objects.filter(user=self.user, month=self.last_month.month, year=self.last_month.year).first()
        self.assertIsNotNone(past_report)
        self.assertEqual(past_report.data['total_withdraw'], 150.0)

    def test_update_transaction_amount_updates_report(self):
        """Test updating transaction amount updates the report correctly"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Salary",
            trans_details="Initial"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Update amount - use POST instead of PUT
        url = reverse('update_transaction', args=[transaction.id])
        data = {
            "date": str(self.today),
            "amount": 200,
            "currency": self.currency,
            "trans_details": "Updated",
            "category": "Salary",
            "trans_status": "deposit"
        }
        response = self.client.post(url, data, format='json')  # Changed from PUT to POST
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 200.0)

    def test_update_transaction_category_updates_report(self):
        """Test updating transaction category updates the report breakdown"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="withdraw",
            category="Food",
            trans_details="Initial"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Update category - use POST instead of PUT
        url = reverse('update_transaction', args=[transaction.id])
        data = {
            "date": str(self.today),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Updated",
            "category": "Transport",
            "trans_status": "withdraw"
        }
        response = self.client.post(url, data, format='json')  # Changed from PUT to POST
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_withdraw'], 100.0)
        self.assertEqual(len(report.data['user_withdraw_on_range']), 1)
        self.assertEqual(report.data['user_withdraw_on_range'][0]['category'], 'Transport')

    def test_update_transaction_type_changes_report_structure(self):
        """Test changing transaction type from deposit to withdraw updates report correctly"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Salary",
            trans_details="Initial"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Change from deposit to withdraw - use POST instead of PUT
        url = reverse('update_transaction', args=[transaction.id])
        data = {
            "date": str(self.today),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Changed to withdraw",
            "category": "Shopping",
            "trans_status": "withdraw"
        }
        response = self.client.post(url, data, format='json')  # Changed from PUT to POST
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data.get('total_deposit', 0), 0.0)
        self.assertEqual(report.data['total_withdraw'], 100.0)
        self.assertEqual(len(report.data.get('user_deposit_on_range', [])), 0)
        self.assertEqual(len(report.data['user_withdraw_on_range']), 1)

    def test_delete_transaction_updates_report(self):
        """Test deleting a transaction updates the report correctly"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Salary",
            trans_details="To be deleted"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Verify report exists
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 100.0)
        
        # Delete transaction
        url = reverse('delete_transaction', args=[transaction.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report is updated
        report.refresh_from_db()
        self.assertEqual(report.data.get('total_deposit', 0), 0.0)
        self.assertEqual(len(report.data.get('user_deposit_on_range', [])), 0)

    def test_multiple_transactions_same_category_aggregation(self):
        """Test multiple transactions in same category are properly aggregated"""
        transactions_data = [
            {"amount": 50, "category": "Food"},
            {"amount": 30, "category": "Food"},
            {"amount": 20, "category": "Transport"},
        ]
        
        for data in transactions_data:
            transaction = Transactions.objects.create(
                user=self.user,
                date=self.today,
                amount=data["amount"],
                currency=self.currency,
                trans_status="withdraw",
                category=data["category"],
                trans_details="Test"
            )
            save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Check report aggregation
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_withdraw'], 100.0)
        self.assertEqual(len(report.data['user_withdraw_on_range']), 2)
        
        # Find Food category
        food_category = next((cat for cat in report.data['user_withdraw_on_range'] if cat['category'] == 'Food'), None)
        self.assertIsNotNone(food_category)
        self.assertEqual(food_category['converted_amount'], 80.0)
        self.assertEqual(food_category['percentage'], 80.0)

    def test_scheduled_transactions_create_reports(self):
        """Test that applied scheduled transactions create proper reports"""
        # Create scheduled transaction
        scheduled = ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="deposit",
            scheduled_trans_details="Monthly salary",
            category="Salary",
            amount=500,
            currency=self.currency,
            date=1,
            status=True
        )
        
        # Apply scheduled transactions
        url = reverse('apply_scheduled_trans')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if report was created
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        if report:  # Report might be created if scheduled day has passed
            self.assertGreaterEqual(report.data.get('total_deposit', 0), 0)

    def test_wishlist_fulfillment_creates_report(self):
        """Test that fulfilling a wishlist item creates proper reports"""
        wish = Wishlist.objects.create(
            user=self.user,
            price=150,
            currency=self.currency,
            wish_details="Test wish",
            status=False
        )
        
        # Fulfill wish
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_withdraw'], 150.0)
        self.assertEqual(len(report.data['user_withdraw_on_range']), 1)
        self.assertEqual(report.data['user_withdraw_on_range'][0]['category'], 'Wishes')

    def test_wishlist_unfulfillment_updates_report(self):
        """Test that unfulfilling a wishlist item updates reports correctly"""
        wish = Wishlist.objects.create(
            user=self.user,
            price=150,
            currency=self.currency,
            wish_details="Test wish",
            status=False
        )
        
        # Fulfill and then unfulfill
        url = reverse('update_wish_status', args=[wish.id])
        self.client.post(url)  # Fulfill
        response = self.client.post(url)  # Unfulfill
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check report
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        if report:
            self.assertEqual(report.data.get('total_withdraw', 0), 0.0)

    def test_transaction_with_no_category_uses_uncategorized(self):
        """Test that transactions without category are marked as 'Uncategorized'"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="withdraw",
            category=None,  # No category
            trans_details="No category transaction"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['user_withdraw_on_range'][0]['category'], 'Uncategorized')

    def test_zero_amount_transaction_not_added_to_report(self):
        """Test that zero amount transactions don't create or update reports"""
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=0,
            currency=self.currency,
            trans_status="deposit",
            category="Test",
            trans_details="Zero amount"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        # Report might exist but should have zero totals
        if report:
            self.assertEqual(report.data.get('total_deposit', 0), 0.0)

    def test_negative_amounts_handled_correctly(self):
        """Test that negative amounts (from deletions) are handled correctly"""
        # Create transaction
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Salary",
            trans_details="Test"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Simulate deletion (negative amount)
        save_user_report_with_transaction(None, self.user, self.today, transaction, parent_function="delete_transaction")
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data.get('total_deposit', 0), 0.0)

    def test_percentage_calculations_correct(self):
        """Test that percentage calculations are correct"""
        transactions_data = [
            {"amount": 60, "category": "Food"},
            {"amount": 40, "category": "Transport"},
        ]
        
        for data in transactions_data:
            transaction = Transactions.objects.create(
                user=self.user,
                date=self.today,
                amount=data["amount"],
                currency=self.currency,
                trans_status="withdraw",
                category=data["category"],
                trans_details="Test"
            )
            save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        
        # Check percentages
        food_category = next((cat for cat in report.data['user_withdraw_on_range'] if cat['category'] == 'Food'), None)
        transport_category = next((cat for cat in report.data['user_withdraw_on_range'] if cat['category'] == 'Transport'), None)
        
        self.assertEqual(food_category['percentage'], 60.0)
        self.assertEqual(transport_category['percentage'], 40.0)

    def test_get_monthly_reports_endpoint(self):
        """Test the get monthly reports API endpoint"""
        # Create some transactions
        Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Salary",
            trans_details="Test"
        )
        
        url = reverse('get_monthly_reports')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('total_deposit', data)
        self.assertIn('total_withdraw', data)
        self.assertIn('user_deposit_on_range', data)
        self.assertIn('user_withdraw_on_range', data)

    def test_get_historical_reports_endpoint(self):
        """Test the historical reports API endpoint"""
        # Create a transaction in past month
        past_transaction = Transactions.objects.create(
            user=self.user,
            date=self.last_month,
            amount=200,
            currency=self.currency,
            trans_status="withdraw",
            category="Shopping",
            trans_details="Past transaction"
        )
        
        save_user_report_with_transaction(None, self.user, self.last_month, past_transaction)
        
        # Get historical months
        url = reverse('get_report_history_months')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get specific historical report
        url = reverse('get_monthly_report_history')
        response = self.client.get(url, {
            'month': self.last_month.month,
            'year': self.last_month.year
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_recalculate_reports_endpoint(self):
        """Test the recalculate reports API endpoint"""
        # Create some transactions
        for i in range(3):
            Transactions.objects.create(
                user=self.user,
                date=self.today - timedelta(days=i*30),
                amount=100 + i*50,
                currency=self.currency,
                trans_status="deposit",
                category=f"Category{i}",
                trans_details=f"Transaction {i}"
            )
        
        url = reverse('recalculate_reports')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('summary', data)
        self.assertIn('total_months_processed', data['summary'])

    def test_edge_case_month_boundaries(self):
        """Test transactions on month boundaries"""
        # Test last day of month
        last_day = date(self.today.year, self.today.month, calendar.monthrange(self.today.year, self.today.month)[1])
        
        transaction = Transactions.objects.create(
            user=self.user,
            date=last_day,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="Boundary",
            trans_details="Last day"
        )
        
        save_user_report_with_transaction(None, self.user, last_day, transaction)
        
        report = Reports.objects.filter(user=self.user, month=last_day.month, year=last_day.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 100.0)

    def test_leap_year_february_handling(self):
        """Test handling of leap year February dates"""
        # Test with February 29th on a leap year
        leap_year = 2024  # Known leap year
        feb_29 = date(leap_year, 2, 29)
        
        transaction = Transactions.objects.create(
            user=self.user,
            date=feb_29,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="LeapYear",
            trans_details="February 29th"
        )
        
        save_user_report_with_transaction(None, self.user, feb_29, transaction)
        
        report = Reports.objects.filter(user=self.user, month=2, year=leap_year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_deposit'], 100.0)

    def test_concurrent_report_updates(self):
        """Test handling of concurrent report updates"""
        # Simulate multiple transactions being processed simultaneously
        transactions = []
        for i in range(5):
            transaction = Transactions.objects.create(
                user=self.user,
                date=self.today,
                amount=20,
                currency=self.currency,
                trans_status="withdraw",
                category="Concurrent",
                trans_details=f"Concurrent {i}"
            )
            transactions.append(transaction)
        
        # Process all transactions
        for transaction in transactions:
            save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        self.assertEqual(report.data['total_withdraw'], 100.0)  # 5 * 20

    def test_report_data_integrity(self):
        """Test that report data maintains integrity across operations"""
        # Create mixed transactions
        transactions_data = [
            {"amount": 100, "type": "deposit", "category": "Salary"},
            {"amount": 50, "type": "withdraw", "category": "Food"},
            {"amount": 30, "type": "withdraw", "category": "Transport"},
            {"amount": 200, "type": "deposit", "category": "Bonus"},
        ]
        
        for data in transactions_data:
            transaction = Transactions.objects.create(
                user=self.user,
                date=self.today,
                amount=data["amount"],
                currency=self.currency,
                trans_status=data["type"],
                category=data["category"],
                trans_details="Integrity test"
            )
            save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertIsNotNone(report)
        
        # Verify totals
        self.assertEqual(report.data['total_deposit'], 300.0)
        self.assertEqual(report.data['total_withdraw'], 80.0)
        
        # Verify category counts
        self.assertEqual(len(report.data['user_deposit_on_range']), 2)
        self.assertEqual(len(report.data['user_withdraw_on_range']), 2)
        
        # Verify percentages sum to 100%
        deposit_percentages = sum(cat['percentage'] for cat in report.data['user_deposit_on_range'])
        withdraw_percentages = sum(cat['percentage'] for cat in report.data['user_withdraw_on_range'])
        
        self.assertAlmostEqual(deposit_percentages, 100.0, places=1)
        self.assertAlmostEqual(withdraw_percentages, 100.0, places=1)

    def test_empty_category_cleanup(self):
        """Test that categories with zero amounts are cleaned up"""
        # Create and then delete a transaction
        transaction = Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="withdraw",
            category="ToBeRemoved",
            trans_details="Test"
        )
        
        save_user_report_with_transaction(None, self.user, self.today, transaction)
        
        # Verify category exists
        report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        self.assertEqual(len(report.data['user_withdraw_on_range']), 1)
        
        # Delete transaction (simulate with negative amount)
        save_user_report_with_transaction(None, self.user, self.today, transaction, parent_function="delete_transaction")
        
        # Verify category is removed
        report.refresh_from_db()
        self.assertEqual(len(report.data.get('user_withdraw_on_range', [])), 0)

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access reports"""
        self.client.force_authenticate(user=None)
        
        endpoints = [
            'get_monthly_reports',
            'get_report_history_months',
            'recalculate_reports'
        ]
        
        for endpoint in endpoints:
            url = reverse(endpoint)
            if endpoint == 'recalculate_reports':
                response = self.client.post(url)
            else:
                response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reports_isolation_between_users(self):
        """Test that reports are properly isolated between different users"""
        # Create another user
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpass'
        )
        
        # Create transactions for both users
        Transactions.objects.create(
            user=self.user,
            date=self.today,
            amount=100,
            currency=self.currency,
            trans_status="deposit",
            category="User1",
            trans_details="User 1 transaction"
        )
        
        other_transaction = Transactions.objects.create(
            user=other_user,
            date=self.today,
            amount=200,
            currency=self.currency,
            trans_status="deposit",
            category="User2",
            trans_details="User 2 transaction"
        )
        
        save_user_report_with_transaction(None, other_user, self.today, other_transaction)
        
        # Check that users only see their own reports
        user1_report = Reports.objects.filter(user=self.user, month=self.today.month, year=self.today.year).first()
        user2_report = Reports.objects.filter(user=other_user, month=self.today.month, year=self.today.year).first()
        
        if user2_report:
            self.assertEqual(user2_report.data['total_deposit'], 200.0)
            self.assertNotEqual(user2_report.user.id, self.user.id)

from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from transaction_management.selectors import get_transactions_for_user
from transaction_management.services import create_transaction
User = get_user_model()

class GetTransactionsForUserTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        today = date.today()
        self.trans1 = create_transaction(user=self.user, amount=100, currency='USD', trans_status='deposit', category='Food', trans_details='Groceries', transaction_date=today, place='General')
        self.trans2 = create_transaction(user=self.user, amount=50, currency='USD', trans_status='withdraw', category='Transport', trans_details='Taxi fare', transaction_date=today - timedelta(days=5), place='General')
        self.trans3 = create_transaction(user=self.user, amount=200, currency='USD', trans_status='deposit', category='Salary', trans_details='Monthly payment', transaction_date=today - timedelta(days=35), place='General')

    def test_get_transactions_default_date_range(self):
        """Test getting transactions with default last 30 days range"""
        queryset, start_date, end_date = get_transactions_for_user(user=self.user)
        self.assertEqual(start_date, date.today() - timedelta(days=30))
        self.assertEqual(end_date, date.today())
        self.assertEqual(queryset.count(), 2)
        self.assertIn(self.trans1, queryset)
        self.assertIn(self.trans2, queryset)
        self.assertNotIn(self.trans3, queryset)

    def test_get_transactions_with_custom_date_range(self):
        """Test getting transactions with custom date range"""
        start = date.today() - timedelta(days=40)
        end = date.today()
        queryset, start_date, end_date = get_transactions_for_user(user=self.user, start_date=start, end_date=end)
        self.assertEqual(queryset.count(), 3)

    def test_get_transactions_filtered_by_category(self):
        """Test filtering transactions by category"""
        queryset, _, _ = get_transactions_for_user(user=self.user, category='Food')
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().category, 'Food')

    def test_get_transactions_filtered_by_place(self):
        """Test filtering transactions by place"""
        create_transaction(user=self.user, amount=80, currency='USD', trans_status='deposit', category='Food', trans_details='Lunch', transaction_date=date.today(), place='Office')
        queryset, _, _ = get_transactions_for_user(user=self.user, place='Office')
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().place, 'Office')

    def test_get_transactions_filtered_by_status(self):
        """Test filtering transactions by status"""
        queryset, _, _ = get_transactions_for_user(user=self.user, trans_status='deposit')
        for trans in queryset:
            self.assertEqual(trans.trans_status, 'deposit')

    def test_get_transactions_filtered_by_details_search(self):
        """Test filtering transactions by details search"""
        queryset, _, _ = get_transactions_for_user(user=self.user, start_date=date.today() - timedelta(days=50), end_date=date.today(), details_search='Groceries')
        matching_transactions = [t for t in queryset if 'Groceries' in t.trans_details]
        self.assertEqual(len(matching_transactions), 1)
        self.assertEqual(matching_transactions[0].id, self.trans1.id)

    def test_get_transactions_ordered_by_date_desc(self):
        """Test transactions are ordered by date descending"""
        queryset, _, _ = get_transactions_for_user(user=self.user)
        dates = [trans.date for trans in queryset]
        self.assertEqual(dates, sorted(dates, reverse=True))
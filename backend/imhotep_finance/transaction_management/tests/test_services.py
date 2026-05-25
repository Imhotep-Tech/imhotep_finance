from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta
from transaction_management.services import create_transaction, delete_transaction, update_transaction, bulk_import_transactions, parse_csv_transactions
from transaction_management.models import Transactions, NetWorth
from wishlist_management.models import Wishlist
from io import BytesIO
User = get_user_model()

class CreateTransactionServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_create_deposit_transaction_success(self):
        """Test creating a deposit transaction successfully"""
        transaction = create_transaction(user=self.user, amount=100.5, currency='USD', trans_status='deposit', category='Salary', trans_details='Monthly salary', transaction_date=date.today(), place='General')
        self.assertIsNotNone(transaction.id)
        self.assertEqual(transaction.amount, 100.5)
        self.assertEqual(transaction.trans_status, 'deposit')
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 100.5)

    def test_create_withdraw_transaction_success(self):
        """Test creating a withdraw transaction successfully"""
        create_transaction(user=self.user, amount=200, currency='USD', trans_status='deposit', category='Initial', trans_details='', transaction_date=date.today(), place='General')
        transaction = create_transaction(user=self.user, amount=50, currency='USD', trans_status='withdraw', category='Food', trans_details='Groceries', transaction_date=date.today(), place='General')
        self.assertEqual(transaction.amount, 50)
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 150)

    def test_create_transaction_insufficient_funds(self):
        """Test withdraw with insufficient funds raises error"""
        with self.assertRaises(ValidationError) as context:
            create_transaction(user=self.user, amount=100, currency='USD', trans_status='withdraw', category='Food', trans_details='', transaction_date=date.today(), place='General')
        self.assertIn('Insufficient funds', str(context.exception))

    def test_create_transaction_invalid_amount(self):
        """Test creating transaction with invalid amount"""
        with self.assertRaises(ValidationError):
            create_transaction(user=self.user, amount=-50, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')

    def test_create_transaction_no_user(self):
        """Test creating transaction without user raises error"""
        with self.assertRaises(ValidationError):
            create_transaction(user=None, amount=100, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')

    def test_create_transaction_invalid_currency(self):
        """Test creating transaction with invalid currency"""
        with self.assertRaises(ValidationError):
            create_transaction(user=self.user, amount=100, currency='INVALID', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')

    def test_create_transaction_cleans_dirty_place_casing(self):
        """Test that messy casing and whitespaces in place names are formatted properly during creation"""
        transaction = create_transaction(user=self.user, amount=100, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='   oFFiCE  ')
        self.assertEqual(transaction.place, 'Office')
        networth = NetWorth.objects.get(user=self.user, currency='USD', place='Office')
        self.assertEqual(float(networth.total), 100)

        # Empty place should default to 'General'
        empty_transaction = create_transaction(user=self.user, amount=50, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='   ')
        self.assertEqual(empty_transaction.place, 'General')
        networth_general = NetWorth.objects.get(user=self.user, currency='USD', place='General')
        self.assertEqual(float(networth_general.total), 50)

class DeleteTransactionServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.transaction = create_transaction(user=self.user, amount=100, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')

    def test_delete_transaction_success(self):
        """Test deleting a transaction successfully"""
        transaction_id = self.transaction.id
        new_total = delete_transaction(user=self.user, transaction_id=transaction_id)
        self.assertEqual(new_total, 0)
        self.assertFalse(Transactions.objects.filter(id=transaction_id).exists())

    def test_delete_transaction_negative_balance(self):
        """Test deleting transaction that would result in negative balance"""
        withdraw = create_transaction(user=self.user, amount=50, currency='USD', trans_status='withdraw', category='Test', trans_details='', transaction_date=date.today(), place='General')
        with self.assertRaises(ValidationError) as context:
            delete_transaction(user=self.user, transaction_id=self.transaction.id)
        self.assertIn('negative balance', str(context.exception))

    def test_delete_transaction_updates_wishlist(self):
        """Test deleting transaction updates associated wishlist"""
        wishlist = Wishlist.objects.create(user=self.user, transaction=self.transaction, price=100, currency='USD', status=True, wish_details='Test wish')
        delete_transaction(user=self.user, transaction_id=self.transaction.id)
        wishlist.refresh_from_db()
        self.assertFalse(wishlist.status)

class UpdateTransactionServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.transaction = create_transaction(user=self.user, amount=100, currency='USD', trans_status='deposit', category='Initial', trans_details='', transaction_date=date.today(), place='General')

    def test_update_transaction_amount(self):
        """Test updating transaction amount"""
        updated = update_transaction(user=self.user, transaction_id=self.transaction.id, amount=150, currency='USD', trans_status='deposit', category='Updated', trans_details='Updated details', transaction_date=date.today(), place='General')
        self.assertEqual(updated.amount, 150)
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 150)

    def test_update_transaction_rejects_status_change(self):
        """Test updating transaction status from deposit to withdraw"""
        with self.assertRaises(ValidationError) as context:
            update_transaction(user=self.user, transaction_id=self.transaction.id, amount=100, currency='USD', trans_status='withdraw', category='Updated', trans_details='', transaction_date=date.today(), place='General')
        self.assertIn('Transaction status (Income/Expense) cannot be changed after creation', str(context.exception))

    def test_update_transaction_rejects_currency_change(self):
        """Test that currency changes are rejected on update"""
        with self.assertRaises(ValidationError) as context:
            update_transaction(user=self.user, transaction_id=self.transaction.id, amount=100, currency='EUR', trans_status='deposit', category='Updated', trans_details='Updated details', transaction_date=date.today(), place='General')
        self.assertIn('Currency cannot be changed', str(context.exception))

    def test_update_transaction_accepts_place_change(self):
        """Test that place changes are accepted on update and update net worth correctly"""
        updated = update_transaction(user=self.user, transaction_id=self.transaction.id, amount=100, currency='USD', trans_status='deposit', category='Updated', trans_details='Updated details', transaction_date=date.today(), place='Office')
        self.assertEqual(updated.place, 'Office')
        old_networth = NetWorth.objects.get(user=self.user, currency='USD', place='General')
        new_networth = NetWorth.objects.get(user=self.user, currency='USD', place='Office')
        self.assertEqual(float(old_networth.total), 0)
        self.assertEqual(float(new_networth.total), 100)

    def test_update_transaction_insufficient_balance(self):
        """Test updating a withdraw transaction to an amount that exceeds available balance"""
        create_transaction(user=self.user, amount=50, currency='USD', trans_status='deposit', category='Extra', trans_details='', transaction_date=date.today(), place='General')
        # Total balance is 150 (100 from setup + 50)
        withdraw_trans = create_transaction(user=self.user, amount=20, currency='USD', trans_status='withdraw', category='Test', trans_details='', transaction_date=date.today(), place='General')
        # Now try to update the withdraw to 200, which exceeds the balance
        with self.assertRaises(ValidationError) as context:
            update_transaction(user=self.user, transaction_id=withdraw_trans.id, amount=200, currency='USD', trans_status='withdraw', category='Test', trans_details='', transaction_date=date.today(), place='General')
        self.assertIn('Insufficient funds', str(context.exception))

    def test_update_transaction_cleans_dirty_place_casing(self):
        """Test that messy casing and whitespaces in place names are formatted properly during update"""
        updated = update_transaction(user=self.user, transaction_id=self.transaction.id, amount=100, currency='USD', trans_status='deposit', category='Updated', trans_details='', transaction_date=date.today(), place='  home  ')
        self.assertEqual(updated.place, 'Home')
        old_networth = NetWorth.objects.get(user=self.user, currency='USD', place='General')
        new_networth = NetWorth.objects.get(user=self.user, currency='USD', place='Home')
        self.assertEqual(float(old_networth.total), 0)
        self.assertEqual(float(new_networth.total), 100)

class BulkImportTransactionsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_bulk_import_success(self):
        """Test bulk importing transactions successfully"""
        transactions_data = [{'date': '2024-01-15', 'amount': 100, 'currency': 'USD', 'trans_status': 'deposit', 'category': 'Salary', 'trans_details': 'Monthly salary'}, {'date': '2024-01-16', 'amount': 50, 'currency': 'USD', 'trans_status': 'deposit', 'category': 'Bonus', 'trans_details': ''}]
        created_count, errors = bulk_import_transactions(user=self.user, transactions_data=transactions_data)
        self.assertEqual(created_count, 2)
        self.assertEqual(len(errors), 0)
        self.assertEqual(Transactions.objects.filter(user=self.user).count(), 2)

    def test_bulk_import_with_errors(self):
        """Test bulk import with some invalid transactions"""
        transactions_data = [{'date': '2024-01-15', 'amount': 100, 'currency': 'USD', 'trans_status': 'deposit', 'category': 'Valid', 'trans_details': ''}, {'date': 'invalid-date', 'amount': 50, 'currency': 'USD', 'trans_status': 'deposit', 'category': 'Invalid', 'trans_details': ''}]
        created_count, errors = bulk_import_transactions(user=self.user, transactions_data=transactions_data)
        self.assertEqual(created_count, 1)
        self.assertGreater(len(errors), 0)
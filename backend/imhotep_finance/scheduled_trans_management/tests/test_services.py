from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date
from scheduled_trans_management.services import (
    create_scheduled_transaction,
    delete_scheduled_transaction,
    update_scheduled_transaction,
    toggle_scheduled_transaction_status,
    apply_scheduled_transactions
)
from scheduled_trans_management.models import ScheduledTransaction
from transaction_management.models import Transactions, NetWorth

User = get_user_model()


class CreateScheduledTransactionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_create_scheduled_transaction_success(self):
        """Test creating a scheduled transaction successfully"""
        scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500.00,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details='Monthly salary'
        )
        
        self.assertIsNotNone(scheduled_trans.id)
        self.assertEqual(scheduled_trans.date, 15)
        self.assertEqual(float(scheduled_trans.amount), 500.00)
        self.assertTrue(scheduled_trans.status)  # Active by default
    
    def test_create_scheduled_transaction_invalid_amount(self):
        """Test creating scheduled transaction with invalid amount"""
        with self.assertRaises(ValidationError):
            create_scheduled_transaction(
                user=self.user,
                day_of_month=15,
                amount=-100,
                currency='USD',
                scheduled_trans_status='deposit',
                category='Test',
                scheduled_trans_details=''
            )
    
    def test_create_scheduled_transaction_invalid_day(self):
        """Test creating scheduled transaction with invalid day"""
        with self.assertRaises(ValidationError):
            create_scheduled_transaction(
                user=self.user,
                day_of_month=32,
                amount=100,
                currency='USD',
                scheduled_trans_status='deposit',
                category='Test',
                scheduled_trans_details=''
            )
    
    def test_create_scheduled_transaction_no_user(self):
        """Test creating scheduled transaction without user"""
        with self.assertRaises(ValidationError):
            create_scheduled_transaction(
                user=None,
                day_of_month=15,
                amount=100,
                currency='USD',
                scheduled_trans_status='deposit',
                category='Test',
                scheduled_trans_details=''
            )


class DeleteScheduledTransactionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details=''
        )
    
    def test_delete_scheduled_transaction_success(self):
        """Test deleting scheduled transaction"""
        scheduled_id = self.scheduled_trans.id
        result = delete_scheduled_transaction(
            user=self.user,
            scheduled_trans_id=scheduled_id
        )
        
        self.assertTrue(result)
        self.assertFalse(ScheduledTransaction.objects.filter(id=scheduled_id).exists())


class UpdateScheduledTransactionServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details='Original'
        )
    
    def test_update_scheduled_transaction_success(self):
        """Test updating scheduled transaction"""
        updated = update_scheduled_transaction(
            user=self.user,
            scheduled_trans_id=self.scheduled_trans.id,
            day_of_month=20,
            amount=600,
            currency='EUR',
            scheduled_trans_status='withdraw',
            category='Updated',
            scheduled_trans_details='Updated details'
        )
        
        self.assertEqual(updated.date, 20)
        self.assertEqual(float(updated.amount), 600)
        self.assertEqual(updated.currency, 'EUR')


class ToggleScheduledTransactionStatusTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details=''
        )
    
    def test_toggle_status(self):
        """Test toggling active status"""
        # Initially active
        self.assertTrue(self.scheduled_trans.status)
        
        # Toggle to inactive
        updated = toggle_scheduled_transaction_status(
            user=self.user,
            scheduled_trans_id=self.scheduled_trans.id
        )
        self.assertFalse(updated.status)
        
        # Toggle back to active
        updated = toggle_scheduled_transaction_status(
            user=self.user,
            scheduled_trans_id=self.scheduled_trans.id
        )
        self.assertTrue(updated.status)


class ApplyScheduledTransactionsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        NetWorth.objects.create(user=self.user, currency='USD', total=0)
    
    def test_apply_scheduled_transactions_first_time(self):
        """Test applying scheduled transactions for the first time"""
        # Create scheduled transaction for day 1 of current month
        today = date.today()
        scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=1,
            amount=1000,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details='Monthly salary'
        )
        
        # Apply scheduled transactions
        result = apply_scheduled_transactions(user=self.user)
        
        self.assertTrue(result['success'])
        self.assertGreaterEqual(result['applied_count'], 0)
        
        # Verify transaction was created if day has passed
        if today.day >= 1:
            self.assertTrue(Transactions.objects.filter(user=self.user).exists())
    
    def test_apply_scheduled_transactions_insufficient_funds(self):
        """Test applying scheduled transaction with insufficient funds"""
        # Create scheduled withdrawal without enough balance
        scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=1,
            amount=5000,
            currency='USD',
            scheduled_trans_status='withdraw',
            category='Test',
            scheduled_trans_details=''
        )
        
        result = apply_scheduled_transactions(user=self.user)
        
        # Should have errors due to insufficient funds
        if date.today().day >= 1:
            self.assertGreater(len(result['errors']), 0)

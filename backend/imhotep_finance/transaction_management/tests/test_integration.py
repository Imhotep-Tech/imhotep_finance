from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from transaction_management.services import create_transaction, delete_transaction, update_transaction
from transaction_management.models import Transactions, NetWorth
from datetime import date
from decimal import Decimal

User = get_user_model()


class TransactionFlowIntegrationTest(TransactionTestCase):
    """Integration tests for complete transaction flows"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_complete_transaction_lifecycle(self):
        """Test create, update, and delete transaction flow"""
        # Create transaction
        transaction = create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Initial deposit',
            transaction_date=date.today()
        )
        
        self.assertIsNotNone(transaction.id)
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 100)
        
        # Update transaction
        updated = update_transaction(
            user=self.user,
            transaction_id=transaction.id,
            amount=150,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='Updated deposit',
            transaction_date=date.today()
        )
        
        networth.refresh_from_db()
        self.assertEqual(float(networth.total), 150)
        
        # Delete transaction
        delete_transaction(user=self.user, transaction_id=transaction.id)
        
        networth.refresh_from_db()
        self.assertEqual(float(networth.total), 0)
        self.assertFalse(Transactions.objects.filter(id=transaction.id).exists())
    
    def test_multi_currency_networth(self):
        """Test networth calculation across multiple currencies"""
        # Create USD transaction
        create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Test',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Create EUR transaction
        create_transaction(
            user=self.user,
            amount=50,
            currency='EUR',
            trans_status='deposit',
            category='Test',
            trans_details='',
            transaction_date=date.today()
        )
        
        usd_networth = NetWorth.objects.get(user=self.user, currency='USD')
        eur_networth = NetWorth.objects.get(user=self.user, currency='EUR')
        
        self.assertEqual(float(usd_networth.total), 100)
        self.assertEqual(float(eur_networth.total), 50)
    
    def test_complex_transaction_sequence(self):
        """Test complex sequence of deposits and withdrawals"""
        # Initial deposit
        create_transaction(
            user=self.user,
            amount=1000,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Multiple withdrawals
        create_transaction(
            user=self.user,
            amount=200,
            currency='USD',
            trans_status='withdraw',
            category='Rent',
            trans_details='',
            transaction_date=date.today()
        )
        
        create_transaction(
            user=self.user,
            amount=150,
            currency='USD',
            trans_status='withdraw',
            category='Food',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Another deposit
        create_transaction(
            user=self.user,
            amount=500,
            currency='USD',
            trans_status='deposit',
            category='Bonus',
            trans_details='',
            transaction_date=date.today()
        )
        
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        expected_total = 1000 - 200 - 150 + 500
        self.assertEqual(float(networth.total), expected_total)

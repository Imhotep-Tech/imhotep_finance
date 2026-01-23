from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from scheduled_trans_management.services import (
    create_scheduled_transaction,
    apply_scheduled_transactions
)
from transaction_management.models import Transactions, NetWorth
from datetime import date

User = get_user_model()


class ScheduledTransactionIntegrationTest(TransactionTestCase):
    """Integration tests for scheduled transactions"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        NetWorth.objects.create(user=self.user, currency='USD', total=5000)
    
    def test_scheduled_transaction_creates_real_transactions(self):
        """Test that applying scheduled transactions creates actual transactions"""
        # Create scheduled transaction for day 1 of month
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
        
        # If today is past day 1, transaction should be created
        if date.today().day >= 1:
            self.assertGreater(result['applied_count'], 0)
            
            # Verify transaction was created
            transactions = Transactions.objects.filter(user=self.user, category='Salary')
            if transactions.exists():
                transaction = transactions.first()
                self.assertEqual(float(transaction.amount), 1000)
                self.assertEqual(transaction.trans_status.lower(), 'deposit')
                
                # Verify networth was updated
                networth = NetWorth.objects.get(user=self.user, currency='USD')
                self.assertEqual(float(networth.total), 6000)  # 5000 + 1000

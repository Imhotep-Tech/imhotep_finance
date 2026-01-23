from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from target_management.services import create_target_for_user, calculate_score
from transaction_management.services import create_transaction
from target_management.models import Target
from datetime import date

User = get_user_model()


class TargetTransactionIntegrationTest(TransactionTestCase):
    """Integration tests for target and transaction interaction"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_target_score_updates_with_transactions(self):
        """Test that target score updates as transactions are added"""
        # Create target
        target = create_target_for_user(user=self.user, target_value=1000.00)
        
        # Add first transaction
        create_transaction(
            user=self.user,
            amount=500,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Calculate score
        _, _, score = calculate_score(user=self.user, target_obj=target)
        # Score is (500 deposits - 1000 target) - 0 withdrawals = -500
        self.assertEqual(score, -500)
        
        # Add another transaction
        create_transaction(
            user=self.user,
            amount=300,
            currency='USD',
            trans_status='deposit',
            category='Bonus',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Recalculate score
        _, _, score = calculate_score(user=self.user, target_obj=target)
        # Score is (800 deposits - 1000 target) - 0 withdrawals = -200
        self.assertEqual(score, -200)
    
    def test_monthly_target_tracking(self):
        """Test tracking different targets for different months"""
        # Create current month target
        current_target = create_target_for_user(user=self.user, target_value=1000.00)
        
        # Create transaction for current month
        create_transaction(
            user=self.user,
            amount=800,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='',
            transaction_date=date.today()
        )
        
        # Calculate score
        _, _, score = calculate_score(user=self.user, target_obj=current_target)
        # Score is (800 deposits - 1000 target) - 0 withdrawals = -200
        self.assertEqual(score, -200)
        
        # Verify target score is saved
        current_target.refresh_from_db()
        self.assertEqual(current_target.score, -200)

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
        target = create_target_for_user(user=self.user, target_value=1000.0)
        create_transaction(user=self.user, amount=500, currency='USD', trans_status='deposit', category='Salary', trans_details='', transaction_date=date.today(), place='General')
        _, _, score = calculate_score(user=self.user, target_obj=target)
        self.assertEqual(score, -500)
        create_transaction(user=self.user, amount=300, currency='USD', trans_status='deposit', category='Bonus', trans_details='', transaction_date=date.today(), place='General')
        _, _, score = calculate_score(user=self.user, target_obj=target)
        self.assertEqual(score, -200)

    def test_monthly_target_tracking(self):
        """Test tracking different targets for different months"""
        current_target = create_target_for_user(user=self.user, target_value=1000.0)
        create_transaction(user=self.user, amount=800, currency='USD', trans_status='deposit', category='Salary', trans_details='', transaction_date=date.today(), place='General')
        _, _, score = calculate_score(user=self.user, target_obj=current_target)
        self.assertEqual(score, -200)
        current_target.refresh_from_db()
        self.assertEqual(current_target.score, -200)
from django.test import TestCase
from django.contrib.auth import get_user_model
from scheduled_trans_management.selectors import get_scheduled_transactions_for_user
from scheduled_trans_management.services import create_scheduled_transaction

User = get_user_model()


class GetScheduledTransactionsForUserTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        
        # Create active scheduled transaction
        self.active_st = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details='Active'
        )
        
        # Create inactive scheduled transaction
        self.inactive_st = create_scheduled_transaction(
            user=self.user,
            day_of_month=20,
            amount=300,
            currency='USD',
            scheduled_trans_status='withdraw',
            category='Bills',
            scheduled_trans_details='Inactive'
        )
        self.inactive_st.status = False
        self.inactive_st.save()
    
    def test_get_all_scheduled_transactions(self):
        """Test getting all scheduled transactions"""
        scheduled = get_scheduled_transactions_for_user(user=self.user, status_filter=None)
        self.assertEqual(scheduled.count(), 2)
    
    def test_get_active_scheduled_transactions(self):
        """Test getting only active scheduled transactions"""
        scheduled = get_scheduled_transactions_for_user(user=self.user, status_filter=True)
        self.assertEqual(scheduled.count(), 1)
        self.assertEqual(scheduled.first().id, self.active_st.id)
    
    def test_get_inactive_scheduled_transactions(self):
        """Test getting only inactive scheduled transactions"""
        scheduled = get_scheduled_transactions_for_user(user=self.user, status_filter=False)
        self.assertEqual(scheduled.count(), 1)
        self.assertEqual(scheduled.first().id, self.inactive_st.id)

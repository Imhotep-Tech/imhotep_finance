from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from scheduled_trans_management.services import create_scheduled_transaction
from scheduled_trans_management.models import ScheduledTransaction
from transaction_management.models import NetWorth

User = get_user_model()


class ScheduledTransactionCreateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('add_scheduled_trans')
    
    def test_create_scheduled_transaction_success(self):
        """Test creating scheduled transaction via API"""
        data = {
            'day_of_month': 15,
            'amount': '500.00',
            'currency': 'USD',
            'scheduled_trans_status': 'deposit',
            'category': 'Salary',
            'scheduled_trans_details': 'Monthly salary'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertTrue(ScheduledTransaction.objects.filter(user=self.user).exists())
    
    def test_create_scheduled_transaction_invalid_data(self):
        """Test creating scheduled transaction with invalid data"""
        data = {
            'day_of_month': 32,  # Invalid day
            'amount': '500.00',
            'currency': 'USD',
            'scheduled_trans_status': 'deposit'
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ScheduledTransactionDeleteApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details=''
        )
        
        self.url = reverse('delete_scheduled_trans', kwargs={'scheduled_trans_id': self.scheduled_trans.id})
    
    def test_delete_scheduled_transaction_success(self):
        """Test deleting scheduled transaction via API"""
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ScheduledTransaction.objects.filter(id=self.scheduled_trans.id).exists())


class ScheduledTransactionListApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_scheduled_trans')
        
        # Create test scheduled transactions
        for i in range(3):
            create_scheduled_transaction(
                user=self.user,
                day_of_month=i + 1,
                amount=100 * (i + 1),
                currency='USD',
                scheduled_trans_status='deposit',
                category=f'Category{i}',
                scheduled_trans_details=''
            )
    
    def test_get_scheduled_transactions(self):
        """Test getting scheduled transactions"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('scheduled_transactions', response.data)
        self.assertEqual(len(response.data['scheduled_transactions']), 3)


class ToggleScheduledTransactionStatusApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.scheduled_trans = create_scheduled_transaction(
            user=self.user,
            day_of_month=15,
            amount=500,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Salary',
            scheduled_trans_details=''
        )
        
        self.url = reverse('toggle_scheduled_status', kwargs={'scheduled_trans_id': self.scheduled_trans.id})
    
    def test_toggle_status(self):
        """Test toggling scheduled transaction status"""
        # Initially active
        self.assertTrue(self.scheduled_trans.status)
        
        # Toggle to inactive
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['status'])


class ApplyScheduledTransactionsApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('apply_scheduled_trans')
        
        # Create networth
        NetWorth.objects.create(user=self.user, currency='USD', total=1000)
    
    def test_apply_scheduled_transactions(self):
        """Test applying scheduled transactions"""
        # Create scheduled transaction for day 1
        create_scheduled_transaction(
            user=self.user,
            day_of_month=1,
            amount=100,
            currency='USD',
            scheduled_trans_status='deposit',
            category='Test',
            scheduled_trans_details=''
        )
        
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)
        self.assertIn('applied_count', response.data)

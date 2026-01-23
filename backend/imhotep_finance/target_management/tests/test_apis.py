from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from target_management.services import create_target_for_user
from target_management.models import Target
from transaction_management.services import create_transaction
from datetime import date

User = get_user_model()


class TargetManagementApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('manage_target')  # Fixed URL name
    
    def test_create_target_success(self):
        """Test creating target via API"""
        data = {'target': '1000.00'}
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Changed to 200
        self.assertIn('message', response.data)
        self.assertTrue(Target.objects.filter(user=self.user).exists())
    
    def test_create_target_unauthenticated(self):
        """Test creating target without authentication"""
        self.client.force_authenticate(user=None)
        data = {'target': '1000.00'}
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_target_invalid_data(self):
        """Test creating target with invalid data"""
        data = {'target': '-100'}
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_update_existing_target(self):
        """Test updating existing target"""
        # Create initial target
        data = {'target': '1000.00'}
        self.client.post(self.url, data, format='json')
        
        # Update target
        data = {'target': '1500.00'}
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Changed to 200
        self.assertEqual(Target.objects.filter(user=self.user).count(), 1)
        target = Target.objects.get(user=self.user)
        self.assertEqual(float(target.target), 1500.00)


class GetTargetApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_target')
        self.target = create_target_for_user(user=self.user, target_value=1000.00)
    
    def test_get_target_success(self):
        """Test getting target via API"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(float(response.data['target']), 1000.00)
    
    def test_get_target_not_found(self):
        """Test getting target when none exists"""
        Target.objects.all().delete()
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class GetScoreApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_score')
        self.target = create_target_for_user(user=self.user, target_value=1000.00)
    
    def test_get_score_no_transactions(self):
        """Test getting score with no transactions"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('score', response.data)
        # Score is (0 deposits - 1000 target) - 0 withdrawals = -1000
        self.assertEqual(float(response.data['score']), -1000)
        self.assertIn('score_txt', response.data)
        self.assertEqual(response.data['score_txt'], 'Below target')
    
    def test_get_score_with_transactions(self):
        """Test getting score with transactions"""
        # Create a transaction
        create_transaction(
            user=self.user,
            amount=800,
            currency='USD',
            trans_status='deposit',
            category='Salary',
            trans_details='',
            transaction_date=date.today()
        )
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Score is (800 deposits - 1000 target) - 0 withdrawals = -200
        self.assertEqual(float(response.data['score']), -200)
        self.assertIn('below target', response.data['score_txt'].lower())
    
    def test_get_score_no_target(self):
        """Test getting score when no target exists"""
        Target.objects.all().delete()
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class GetScoreHistoryApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_score_history')
    
    def test_get_history_empty(self):
        """Test getting history when no targets exist"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['targets']), 0)
    
    def test_get_history_with_targets(self):
        """Test getting history with multiple targets"""
        # Create multiple targets
        Target.objects.create(
            user=self.user, target=1000, month=1, year=2024, score=80
        )
        Target.objects.create(
            user=self.user, target=1200, month=2, year=2024, score=90
        )
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['targets']), 2)
        self.assertIn('pagination', response.data)
    
    def test_get_history_pagination(self):
        """Test history pagination"""
        # Create multiple targets
        for i in range(25):
            Target.objects.create(
                user=self.user, 
                target=1000 + i, 
                month=(i % 12) + 1, 
                year=2024, 
                score=0
            )
        
        response = self.client.get(self.url, {'page': 1})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['targets']), 20)
        self.assertEqual(response.data['pagination']['num_pages'], 2)

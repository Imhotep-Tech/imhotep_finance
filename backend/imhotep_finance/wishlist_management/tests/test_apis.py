from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from wishlist_management.services import create_wish
from wishlist_management.models import Wishlist
from transaction_management.models import NetWorth

User = get_user_model()


class WishCreateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('create_wish')  # Adjust to your actual URL name
    
    def test_create_wish_success(self):
        """Test creating wish via API"""
        data = {
            'price': '500.00',
            'currency': 'USD',
            'year': 2024,
            'wish_details': 'New laptop',
            'link': 'https://example.com'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertTrue(Wishlist.objects.filter(user=self.user).exists())
    
    def test_create_wish_unauthenticated(self):
        """Test creating wish without authentication"""
        self.client.force_authenticate(user=None)
        data = {
            'price': '500.00',
            'currency': 'USD',
            'year': 2024,
            'wish_details': 'Test',
            'link': ''
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_wish_invalid_data(self):
        """Test creating wish with invalid data"""
        data = {
            'price': '-100',
            'currency': 'USD',
            'year': 2024
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class WishDeleteApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.wish = create_wish(
            user=self.user,
            price=500,
            currency='USD',
            year=2024,
            wish_details='Test',
            link=''
        )
        
        self.url = reverse('delete_wish', kwargs={'wish_id': self.wish.id})
    
    def test_delete_wish_success(self):
        """Test deleting wish via API"""
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Wishlist.objects.filter(id=self.wish.id).exists())
    
    def test_delete_wish_not_found(self):
        """Test deleting non-existent wish"""
        url = reverse('delete_wish', kwargs={'wish_id': 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class WishUpdateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.wish = create_wish(
            user=self.user,
            price=500,
            currency='USD',
            year=2024,
            wish_details='Original',
            link=''
        )
        
        self.url = reverse('update_wish', kwargs={'wish_id': self.wish.id})
    
    def test_update_wish_success(self):
        """Test updating wish via API"""
        data = {
            'price': '600.00',
            'currency': 'EUR',
            'year': 2025,
            'wish_details': 'Updated',
            'link': 'https://updated.com'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.wish.refresh_from_db()
        self.assertEqual(float(self.wish.price), 600.00)


class GetWishlistApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_wishlist')
        
        # Create test wishes
        for i in range(5):
            create_wish(
                user=self.user,
                price=100 + i * 50,
                currency='USD',
                year=2024,
                wish_details=f'Wish {i}',
                link=''
            )
    
    def test_get_wishlist(self):
        """Test getting wishlist"""
        response = self.client.get(self.url, {'year': 2024})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('wishlist', response.data)
        self.assertIn('pagination', response.data)
        self.assertEqual(len(response.data['wishlist']), 5)


class UpdateWishlistStatusApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        # Create networth
        NetWorth.objects.create(user=self.user, currency='USD', total=1000)
        
        self.wish = create_wish(
            user=self.user,
            price=200,
            currency='USD',
            year=2024,
            wish_details='Test',
            link=''
        )
        
        self.url = reverse('update_wish_status', kwargs={'wish_id': self.wish.id})
    
    def test_mark_wish_as_purchased(self):
        """Test marking wish as purchased via API"""
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['status'])
        
        self.wish.refresh_from_db()
        self.assertTrue(self.wish.status)
        self.assertIsNotNone(self.wish.transaction)
    
    def test_toggle_wish_status(self):
        """Test toggling wish status"""
        # Mark as purchased
        response1 = self.client.post(self.url)
        self.assertTrue(response1.data['status'])
        
        # Unmark
        response2 = self.client.post(self.url)
        self.assertFalse(response2.data['status'])

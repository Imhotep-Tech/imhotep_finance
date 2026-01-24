from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from oauth2_provider.models import Application, AccessToken
from transaction_management.models import Transactions
from transaction_management.services import create_transaction
from datetime import date, timedelta, datetime
from decimal import Decimal
from django.utils import timezone

User = get_user_model()


class ExternalTransactionCreateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=True
        )

        # Create OAuth2 application
        self.application = Application.objects.create(
            name='Test App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://testapp.com/callback'
        )

        # Create OAuth2 access token with transactions:write scope
        self.access_token = AccessToken.objects.create(
            user=self.user,
            application=self.application,
            token='test_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:write'
        )

        # Authenticate with OAuth2 token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token.token}')

    def test_create_transaction_success(self):
        """Test creating transaction via public API"""
        url = reverse('external_create_transaction')
        data = {
            'amount': '100.50',
            'currency': 'USD',
            'trans_status': 'deposit',
            'category': 'Salary',
            'trans_details': 'Monthly payment'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('transaction_id', response.data)
        self.assertEqual(Decimal(str(response.data['amount'])), Decimal('100.50'))
        self.assertTrue(Transactions.objects.filter(user=self.user, id=response.data['transaction_id']).exists())

    def test_create_transaction_without_oauth2_token(self):
        """Test creating transaction without OAuth2 token"""
        self.client.credentials()
        url = reverse('external_create_transaction')
        data = {
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_transaction_without_required_scope(self):
        """Test creating transaction with token that doesn't have transactions:write scope"""
        # Create token with only read scope
        read_token = AccessToken.objects.create(
            user=self.user,
            application=self.application,
            token='read_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:read'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {read_token.token}')
        url = reverse('external_create_transaction')
        data = {
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_transaction_invalid_data(self):
        """Test creating transaction with invalid data"""
        url = reverse('external_create_transaction')
        data = {
            'amount': '-100',  # Negative amount
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transaction_insufficient_funds(self):
        """Test creating withdrawal transaction with insufficient funds"""
        url = reverse('external_create_transaction')
        data = {
            'amount': '1000.00',
            'currency': 'USD',
            'trans_status': 'withdraw'  # Trying to withdraw more than available
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient funds', str(response.data))

    def test_create_transaction_with_date(self):
        """Test creating transaction with specific date"""
        url = reverse('external_create_transaction')
        transaction_date = date.today() - timedelta(days=5)
        data = {
            'amount': '50.00',
            'currency': 'USD',
            'trans_status': 'deposit',
            'date': str(transaction_date)
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        transaction = Transactions.objects.get(id=response.data['transaction_id'])
        self.assertEqual(transaction.date, transaction_date)

    def test_create_transaction_different_user(self):
        """Test that transaction is created for the user associated with the token"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        # Create token for other user
        other_token = AccessToken.objects.create(
            user=other_user,
            application=self.application,
            token='other_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:write'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token.token}')
        url = reverse('external_create_transaction')
        data = {
            'amount': '200.00',
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify transaction belongs to other_user, not self.user
        transaction = Transactions.objects.get(id=response.data['transaction_id'])
        self.assertEqual(transaction.user, other_user)
        self.assertNotEqual(transaction.user, self.user)


class ExternalTransactionDeleteApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=True
        )

        # Create OAuth2 application
        self.application = Application.objects.create(
            name='Test App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://testapp.com/callback'
        )

        # Create OAuth2 access token with transactions:write scope
        self.access_token = AccessToken.objects.create(
            user=self.user,
            application=self.application,
            token='test_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:write'
        )

        # Create a test transaction
        self.transaction = create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Test',
            trans_details='Test transaction',
            transaction_date=date.today()
        )

        # Authenticate with OAuth2 token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token.token}')

    def test_delete_transaction_success(self):
        """Test deleting transaction via public API"""
        url = reverse('external_delete_transaction', kwargs={'transaction_id': self.transaction.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertFalse(Transactions.objects.filter(id=self.transaction.id).exists())

    def test_delete_transaction_without_oauth2_token(self):
        """Test deleting transaction without OAuth2 token"""
        self.client.credentials()
        url = reverse('external_delete_transaction', kwargs={'transaction_id': self.transaction.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_transaction_without_required_scope(self):
        """Test deleting transaction with token that doesn't have transactions:write scope"""
        # Create token with only read scope
        read_token = AccessToken.objects.create(
            user=self.user,
            application=self.application,
            token='read_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:read'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {read_token.token}')
        url = reverse('external_delete_transaction', kwargs={'transaction_id': self.transaction.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_transaction_not_found(self):
        """Test deleting non-existent transaction"""
        url = reverse('external_delete_transaction', kwargs={'transaction_id': 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_transaction_other_user(self):
        """Test deleting transaction belonging to another user"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        # Create transaction for other user
        other_transaction = create_transaction(
            user=other_user,
            amount=200,
            currency='USD',
            trans_status='deposit',
            category='Other',
            trans_details='Other user transaction',
            transaction_date=date.today()
        )

        url = reverse('external_delete_transaction', kwargs={'transaction_id': other_transaction.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Verify transaction still exists
        self.assertTrue(Transactions.objects.filter(id=other_transaction.id).exists())

    def test_delete_transaction_different_user_token(self):
        """Test that user can only delete their own transactions"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        # Create transaction for other user
        other_transaction = create_transaction(
            user=other_user,
            amount=200,
            currency='USD',
            trans_status='deposit',
            category='Other',
            trans_details='Other user transaction',
            transaction_date=date.today()
        )

        # Create token for other user
        other_token = AccessToken.objects.create(
            user=other_user,
            application=self.application,
            token='other_token_12345',
            expires=timezone.now() + timedelta(days=1),
            scope='transactions:write'
        )

        # Try to delete other user's transaction with self.user's token (should fail)
        url = reverse('external_delete_transaction', kwargs={'transaction_id': other_transaction.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Now try with other user's token (should succeed)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {other_token.token}')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Transactions.objects.filter(id=other_transaction.id).exists())

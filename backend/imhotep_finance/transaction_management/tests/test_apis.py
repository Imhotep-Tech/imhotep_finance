from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from transaction_management.services import create_transaction
from transaction_management.models import Transactions, NetWorth
from datetime import date
from decimal import Decimal
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()


class TransactionCreateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('add_transactions')
    
    def test_create_transaction_success(self):
        """Test creating transaction via API"""
        data = {
            'amount': '100.50',
            'currency': 'USD',
            'trans_status': 'deposit',
            'category': 'Salary',
            'trans_details': 'Monthly payment'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertTrue(Transactions.objects.filter(user=self.user).exists())
    
    def test_create_transaction_unauthenticated(self):
        """Test creating transaction without authentication"""
        self.client.force_authenticate(user=None)
        data = {
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_transaction_invalid_data(self):
        """Test creating transaction with invalid data"""
        data = {
            'amount': '-100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }
        
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TransactionListApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_transaction')
        
        # Create test transactions
        for i in range(5):
            create_transaction(
                user=self.user,
                amount=100 + i,
                currency='USD',
                trans_status='deposit',
                category=f'Category{i}',
                trans_details=f'Details {i}',
                transaction_date=date.today()
            )
    
    def test_list_transactions(self):
        """Test listing transactions"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transactions', response.data)
        self.assertIn('pagination', response.data)
        self.assertEqual(len(response.data['transactions']), 5)
    
    def test_list_transactions_with_filters(self):
        """Test listing transactions with filters"""
        response = self.client.get(self.url, {'category': 'Category1'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['transactions']), 1)
    
    def test_list_transactions_pagination(self):
        """Test transaction list pagination"""
        response = self.client.get(self.url, {'page': '1'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pagination']['page'], 1)


class TransactionUpdateApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.transaction = create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Test',
            trans_details='',
            transaction_date=date.today()
        )
        
        self.url = reverse('update_transaction', kwargs={'transaction_id': self.transaction.id})
    
    def test_update_transaction_success(self):
        """Test updating transaction via API"""
        data = {
            'date': str(date.today()),
            'amount': '150.00',
            'currency': 'USD',
            'trans_status': 'deposit',
            'category': 'Updated',
            'trans_details': 'Updated details'
        }
        
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transaction.refresh_from_db()
        self.assertEqual(self.transaction.amount, Decimal('150.00'))
    
    def test_update_transaction_not_found(self):
        """Test updating non-existent transaction"""
        url = reverse('update_transaction', kwargs={'transaction_id': 99999})
        data = {
            'date': str(date.today()),
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TransactionDeleteApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        self.transaction = create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Test',
            trans_details='',
            transaction_date=date.today()
        )
        
        self.url = reverse('delete_transaction', kwargs={'transaction_id': self.transaction.id})
    
    def test_delete_transaction_success(self):
        """Test deleting transaction via API"""
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Transactions.objects.filter(id=self.transaction.id).exists())
    
    def test_delete_transaction_not_found(self):
        """Test deleting non-existent transaction"""
        url = reverse('delete_transaction', kwargs={'transaction_id': 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TransactionExportCSVApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('export_transactions_csv')
        
        # Create test transaction
        create_transaction(
            user=self.user,
            amount=100,
            currency='USD',
            trans_status='deposit',
            category='Test',
            trans_details='Export test',
            transaction_date=date.today()
        )
    
    def test_export_csv_success(self):
        """Test exporting transactions as CSV"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])


class TransactionImportCSVApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('import_transactions_csv')
    
    def test_import_csv_success(self):
        """Test importing transactions from CSV"""
        # Create CSV content with proper format
        csv_content = b"date,amount,currency,trans_status,category,trans_details\n2024-01-15,100,USD,deposit,Salary,Monthly\n"
        csv_file = SimpleUploadedFile(
            "test.csv",
            csv_content,
            content_type="text/csv"
        )
        
        response = self.client.post(self.url, {'file': csv_file}, format='multipart')
        
        # Debug output
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if there are errors in the response
        if 'errors' in response.data:
            print(f"Import errors: {response.data['errors']}")
        
        self.assertTrue(response.data['success'], f"Import failed with errors: {response.data.get('errors', [])}")
        self.assertEqual(response.data['imported_count'], 1)
        
        # Verify transaction was created
        self.assertTrue(Transactions.objects.filter(user=self.user, amount=100).exists())
    
    def test_import_csv_invalid_file(self):
        """Test importing invalid CSV file"""
        response = self.client.post(self.url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_import_csv_with_errors(self):
        """Test importing CSV with some invalid rows"""
        csv_content = b"date,amount,currency,trans_status\n2024-01-15,100,USD,deposit\ninvalid-date,50,USD,deposit\n"
        csv_file = SimpleUploadedFile(
            "test.csv",
            csv_content,
            content_type="text/csv"
        )
        
        response = self.client.post(self.url, {'file': csv_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['imported_count'], 1)
        self.assertIn('errors', response.data)
        self.assertGreater(len(response.data['errors']), 0)

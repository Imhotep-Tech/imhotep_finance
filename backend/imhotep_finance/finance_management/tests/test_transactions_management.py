from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from finance_management.models import NetWorth, Transactions
from datetime import date

class TransactionManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass'
        )
        self.client.force_authenticate(user=self.user)
        self.currency = 'USD'
        self.networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=1000)

    def test_add_transaction_deposit(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Test deposit",
            "category": "Salary",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.networth.refresh_from_db()
        self.assertEqual(float(self.networth.total), 1100)

    def test_add_transaction_withdraw(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 200,
            "currency": self.currency,
            "trans_details": "Test withdraw",
            "category": "Shopping",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.networth.refresh_from_db()
        self.assertEqual(float(self.networth.total), 800)

    def test_get_transaction(self):
        Transactions.objects.create(
            user=self.user, date=date.today(), amount=50, currency=self.currency,
            trans_details="Test", category="Misc", trans_status="Deposit"
        )
        url = reverse('get_transaction')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transactions', response.data)

    def test_update_transaction(self):
        trans = Transactions.objects.create(
            user=self.user, date=date.today(), amount=100, currency=self.currency,
            trans_details="Old", category="Misc", trans_status="Deposit"
        )
        url = reverse('update_transaction', args=[trans.id])
        data = {
            "date": str(date.today()),
            "amount": 200,
            "currency": self.currency,
            "trans_details": "Updated",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        trans.refresh_from_db()
        self.assertEqual(trans.amount, 200)

    def test_delete_transaction(self):
        trans = Transactions.objects.create(
            user=self.user, date=date.today(), amount=100, currency=self.currency,
            trans_details="To delete", category="Misc", trans_status="Deposit"
        )
        url = reverse('delete_transaction', args=[trans.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Transactions.objects.filter(id=trans.id).exists())

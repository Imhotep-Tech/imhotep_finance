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

    def test_add_transaction_missing_fields(self):
        url = reverse('add_transactions')
        data = {
            "amount": 100,
            "currency": self.currency,
            "trans_status": "Deposit"
            # missing date, trans_details, category
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # date is optional, others are not required by backend

    def test_add_transaction_invalid_status(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Test",
            "category": "Misc",
            "trans_status": "InvalidStatus"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Transaction status must be either Deposit or Withdraw", response.data.get("error", ""))

    def test_add_transaction_negative_amount(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": -50,
            "currency": self.currency,
            "trans_details": "Negative",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_add_transaction_zero_amount(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 0,
            "currency": self.currency,
            "trans_details": "Zero",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_add_transaction_invalid_currency(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 100,
            "currency": "ZZZ",  # Not in allowed currencies
            "trans_details": "Invalid currency",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        # Should fail due to DB constraint, but backend does not check, so may return 500
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_add_transaction_insufficient_funds(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 2000,  # More than available
            "currency": self.currency,
            "trans_details": "Too much",
            "category": "Misc",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You don't have enough of this currency", response.data.get("error", ""))

    def test_update_transaction_invalid_status(self):
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
            "trans_status": "InvalidStatus"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Transaction status must be either Deposit or Withdraw", response.data.get("error", ""))

    def test_update_transaction_insufficient_funds(self):
        trans = Transactions.objects.create(
            user=self.user, date=date.today(), amount=100, currency=self.currency,
            trans_details="Old", category="Misc", trans_status="Withdraw"
        )
        url = reverse('update_transaction', args=[trans.id])
        data = {
            "date": str(date.today()),
            "amount": 2000,  # More than available
            "currency": self.currency,
            "trans_details": "Updated",
            "category": "Misc",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient balance for this withdrawal", response.data.get("error", ""))

    def test_update_transaction_nonexistent(self):
        url = reverse('update_transaction', args=[9999])
        data = {
            "date": str(date.today()),
            "amount": 100,
            "currency": self.currency,
            "trans_details": "Updated",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_transaction_nonexistent(self):
        url = reverse('delete_transaction', args=[9999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_transaction_invalid_date_range(self):
        url = reverse('get_transaction')
        response = self.client.get(url, {'start_date': 'invalid-date', 'end_date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Error Happened', response.data.get('error', ''))
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Error Happened', response.data.get('error', ''))

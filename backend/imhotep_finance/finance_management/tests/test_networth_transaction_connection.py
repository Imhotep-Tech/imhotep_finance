from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from finance_management.models import NetWorth, Transactions
from datetime import date

class NetworthTransactionConnectionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass'
        )
        self.client.force_authenticate(user=self.user)
        self.currency = 'USD'

    def test_deposit_updates_networth(self):
        """Test that a deposit transaction increases networth."""
        initial_networth = 1000.0
        NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth)

        url = reverse('add_transactions')
        deposit_amount = 100.0
        data = {
            "date": str(date.today()),
            "amount": deposit_amount,
            "currency": self.currency,
            "trans_details": "Test deposit",
            "category": "Salary",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth = NetWorth.objects.get(user=self.user, currency=self.currency)
        self.assertEqual(float(networth.total), initial_networth + deposit_amount)

    def test_withdraw_updates_networth(self):
        """Test that a withdraw transaction decreases networth."""
        initial_networth = 1000.0
        NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth)

        url = reverse('add_transactions')
        withdraw_amount = 200.0
        data = {
            "date": str(date.today()),
            "amount": withdraw_amount,
            "currency": self.currency,
            "trans_details": "Test withdraw",
            "category": "Shopping",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth = NetWorth.objects.get(user=self.user, currency=self.currency)
        self.assertEqual(float(networth.total), initial_networth - withdraw_amount)

    def test_delete_deposit_updates_networth(self):
        """Test that deleting a deposit transaction decreases networth."""
        initial_networth = 1000.0
        deposit_amount = 100.0
        networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth + deposit_amount)
        transaction = Transactions.objects.create(
            user=self.user, date=date.today(), amount=deposit_amount, currency=self.currency,
            trans_details="Test deposit", category="Salary", trans_status="Deposit"
        )

        url = reverse('delete_transaction', args=[transaction.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth.refresh_from_db()
        self.assertEqual(float(networth.total), initial_networth)

    def test_delete_withdraw_updates_networth(self):
        """Test that deleting a withdraw transaction increases networth."""
        initial_networth = 1000.0
        withdraw_amount = 200.0
        networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth - withdraw_amount)
        transaction = Transactions.objects.create(
            user=self.user, date=date.today(), amount=withdraw_amount, currency=self.currency,
            trans_details="Test withdraw", category="Shopping", trans_status="Withdraw"
        )

        url = reverse('delete_transaction', args=[transaction.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth.refresh_from_db()
        self.assertEqual(float(networth.total), initial_networth)

    def test_update_deposit_updates_networth(self):
       initial_networth = 1000.0
       initial_deposit_amount = 100.0
       updated_deposit_amount = 150.0

       networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth + initial_deposit_amount)
       transaction = Transactions.objects.create(
           user=self.user, date=date.today(), amount=initial_deposit_amount, currency=self.currency,
           trans_details="Initial deposit", category="Salary", trans_status="Deposit"
       )

       url = reverse('update_transaction', args=[transaction.id])
       data = {
           "date": str(date.today()),
           "amount": updated_deposit_amount,
           "currency": self.currency,
           "trans_details": "Updated deposit",
           "category": "Bonus",
           "trans_status": "Deposit"
       }
       response = self.client.post(url, data, format='json')
       self.assertEqual(response.status_code, status.HTTP_200_OK)

       networth.refresh_from_db()
       self.assertEqual(float(networth.total), initial_networth + updated_deposit_amount)

    def test_update_withdraw_updates_networth(self):
        initial_networth = 1000.0
        initial_withdraw_amount = 200.0
        updated_withdraw_amount = 150.0

        networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth - initial_withdraw_amount)
        transaction = Transactions.objects.create(
            user=self.user, date=date.today(), amount=initial_withdraw_amount, currency=self.currency,
            trans_details="Initial withdraw", category="Shopping", trans_status="Withdraw"
        )

        url = reverse('update_transaction', args=[transaction.id])
        data = {
            "date": str(date.today()),
            "amount": updated_withdraw_amount,
            "currency": self.currency,
            "trans_details": "Updated withdraw",
            "category": "Groceries",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth.refresh_from_db()
        self.assertEqual(float(networth.total), initial_networth - updated_withdraw_amount)

    def test_insufficient_funds_withdrawal(self):
        """Test that withdrawing more than the available networth returns an error."""
        initial_networth = 50.0
        NetWorth.objects.create(user=self.user, currency=self.currency, total=initial_networth)

        url = reverse('add_transactions')
        withdraw_amount = 100.0
        data = {
            "date": str(date.today()),
            "amount": withdraw_amount,
            "currency": self.currency,
            "trans_details": "Attempted overdraw",
            "category": "Entertainment",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You don't have enough of this currency", response.data.get("error", ""))

    def test_delete_transaction_invalidates_networth(self):
        """Test deleting transaction updates user networth ."""
        networth_amount = 500
        transaction_amount = 300

        networth = NetWorth.objects.create(user=self.user, total=networth_amount, currency="USD")
        transaction = Transactions.objects.create(
            user=self.user,
            amount=transaction_amount,
            trans_status="deposit",
            currency="USD",
        )

        url = reverse("delete_transaction", args=[transaction.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        networth.refresh_from_db()
        self.assertEqual(networth.total, networth_amount - transaction_amount)

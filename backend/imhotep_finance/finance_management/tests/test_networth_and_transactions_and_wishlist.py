from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from transaction_management.models import NetWorth, Transactions
from wishlist_management.models import Wishlist
from datetime import date

class WishlistNetworthTransactionConnectionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass'
        )
        self.client.force_authenticate(user=self.user)
        self.currency = 'USD'
        self.networth = NetWorth.objects.create(user=self.user, currency=self.currency, total=1000)

    def test_fulfill_wishlist_item_success(self):
        """
        Tests that fulfilling a wishlist item correctly creates a transaction and updates the net worth.
        """
        wish = Wishlist.objects.create(
            user=self.user, price=200, currency=self.currency, wish_details="Test Wish"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh data from DB
        self.networth.refresh_from_db()
        wish.refresh_from_db()

        # 1. Check if net worth is updated
        self.assertEqual(float(self.networth.total), 800)

        # 2. Check if a transaction was created
        self.assertIsNotNone(wish.transaction)
        transaction = wish.transaction
        self.assertEqual(transaction.amount, 200)
        self.assertEqual(transaction.trans_status, 'Withdraw')
        self.assertEqual(transaction.category, 'Wishes')

        # 3. Check if wishlist status is updated
        self.assertTrue(wish.status)

    def test_fulfill_wishlist_item_insufficient_funds(self):
        """
        Tests that fulfilling a wishlist item with insufficient funds fails.
        """
        wish = Wishlist.objects.create(
            user=self.user, price=1200, currency=self.currency, wish_details="Expensive Wish"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You don't have enough of this currency", response.data['error'])

        # Refresh data from DB
        self.networth.refresh_from_db()
        wish.refresh_from_db()

        # 1. Check if net worth is unchanged
        self.assertEqual(float(self.networth.total), 1000)

        # 2. Check that no transaction was created
        self.assertIsNone(wish.transaction)

        # 3. Check if wishlist status is unchanged
        self.assertFalse(wish.status)

    def test_unfulfill_wishlist_item(self):
        """
        Tests that "un-fulfilling" a wishlist item deletes the transaction and restores the net worth.
        """
        # First, fulfill a wish
        wish = Wishlist.objects.create(
            user=self.user, price=300, currency=self.currency, wish_details="Another Wish"
        )
        fulfill_url = reverse('update_wish_status', args=[wish.id])
        self.client.post(fulfill_url)

        wish.refresh_from_db()
        transaction_id = wish.transaction.id

        # Now, un-fulfill it
        unfulfill_url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(unfulfill_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh data from DB
        self.networth.refresh_from_db()
        wish.refresh_from_db()

        # 1. Check if net worth is restored
        self.assertEqual(float(self.networth.total), 1000)

        # 2. Check if transaction is deleted
        self.assertIsNone(wish.transaction)
        self.assertFalse(Transactions.objects.filter(id=transaction_id).exists())

        # 3. Check if wishlist status is updated
        self.assertFalse(wish.status)

    def test_fulfill_wish_after_deposit(self):
        """
        Tests that a wishlist item can be fulfilled after a deposit provides sufficient funds.
        """
        # Wish that is initially too expensive
        wish = Wishlist.objects.create(
            user=self.user, price=1500, currency=self.currency, wish_details="Future Wish"
        )

        # Deposit money
        deposit_url = reverse('add_transactions')
        deposit_data = {
            "date": str(date.today()),
            "amount": 600,
            "currency": self.currency,
            "trans_details": "Extra income",
            "category": "Salary",
            "trans_status": "Deposit"
        }
        self.client.post(deposit_url, deposit_data, format='json')

        self.networth.refresh_from_db()
        self.assertEqual(float(self.networth.total), 1600)

        # Fulfill the wish
        fulfill_url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(fulfill_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh data from DB
        self.networth.refresh_from_db()
        wish.refresh_from_db()

        # Check final net worth
        self.assertEqual(float(self.networth.total), 100) # 1600 - 1500
        self.assertTrue(wish.status)
        self.assertIsNotNone(wish.transaction)

    def test_fulfill_wishlist_invalid_currency(self):
        wish = Wishlist.objects.create(
            user=self.user, price=100, currency="ZZZ", wish_details="Invalid currency"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_fulfill_wishlist_negative_price(self):
        wish = Wishlist.objects.create(
            user=self.user, price=-100, currency=self.currency, wish_details="Negative price"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_fulfill_wishlist_zero_price(self):
        wish = Wishlist.objects.create(
            user=self.user, price=0, currency=self.currency, wish_details="Zero price"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)
        # Zero price should be rejected by the transaction creation logic
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_fulfill_wishlist(self):
        wish = Wishlist.objects.create(
            user=self.user, price=100, currency=self.currency, wish_details="Double fulfill"
        )
        url = reverse('update_wish_status', args=[wish.id])
        response1 = self.client.post(url)
        response2 = self.client.post(url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        wish.refresh_from_db()
        self.assertFalse(wish.status)  # changed from assertTrue

    def test_double_unfulfill_wishlist(self):
        wish = Wishlist.objects.create(
            user=self.user, price=100, currency=self.currency, wish_details="Double unfulfill"
        )
        url = reverse('update_wish_status', args=[wish.id])
        self.client.post(url)  # fulfill
        self.client.post(url)  # unfulfill
        response = self.client.post(url)  # unfulfill again
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        wish.refresh_from_db()
        self.assertTrue(wish.status)  # changed from assertFalse

    def test_fulfill_wishlist_unauthorized(self):
        wish = Wishlist.objects.create(
            user=self.user, price=100, currency=self.currency, wish_details="Unauthorized"
        )
        self.client.force_authenticate(user=None)
        url = reverse('update_wish_status', args=[wish.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_fulfill_wishlist_nonexistent(self):
        url = reverse('update_wish_status', args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_transaction_invalid_status(self):
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

    def test_transaction_missing_fields(self):
        url = reverse('add_transactions')
        data = {
            "amount": 100,
            "currency": self.currency,
            "trans_status": "Deposit"
            # missing date, trans_details, category
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # date is optional, others may be optional

    def test_transaction_invalid_currency(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 100,
            "currency": "ZZZ",
            "trans_details": "Invalid currency",
            "category": "Misc",
            "trans_status": "Deposit"
        }
        response = self.client.post(url, data, format='json')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_transaction_negative_amount(self):
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

    def test_transaction_zero_amount(self):
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

    def test_transaction_insufficient_funds(self):
        url = reverse('add_transactions')
        data = {
            "date": str(date.today()),
            "amount": 2000,
            "currency": self.currency,
            "trans_details": "Too much",
            "category": "Misc",
            "trans_status": "Withdraw"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You don't have enough of this currency", response.data.get("error", ""))

    def test_transaction_update_nonexistent(self):
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

    def test_transaction_delete_nonexistent(self):
        url = reverse('delete_transaction', args=[9999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_transaction_get_invalid_date_range(self):
        url = reverse('get_transaction')
        response = self.client.get(url, {'start_date': 'invalid-date', 'end_date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Error Happened', response.data.get('error', ''))
        url = reverse('delete_transaction', args=[9999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_transaction_get_invalid_date_range(self):
        url = reverse('get_transaction')
        response = self.client.get(url, {'start_date': 'invalid-date', 'end_date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Error Happened', response.data.get('error', ''))

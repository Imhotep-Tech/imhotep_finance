from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from scheduled_trans_management.models import ScheduledTransaction
from transaction_management.models import NetWorth, Transactions
from unittest.mock import patch
from datetime import date, timedelta
from django.utils import timezone
import calendar

class ApplyScheduledTransactionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass"
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("apply_scheduled_trans")
        self.currency = "USD"
        self.networth = NetWorth.objects.create(
            user=self.user, currency=self.currency, total=1000
        )

    def test_apply_scheduled_transactions_success(self):
        """It should apply a scheduled transaction and update networth"""
        ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="deposit",
            scheduled_trans_details="test deposit",
            category="Salary",
            amount=100,
            currency="USD",
            date=1,
            last_time_added=None,
            status=True,
        )
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertGreaterEqual(response.data["applied_count"], 1)
        self.assertEqual(response.data["errors"], [])
        self.networth.refresh_from_db()
        self.assertGreaterEqual(float(self.networth.total), 1100)

    def test_apply_scheduled_transactions_catch_up_multiple_months(self):
        """Transactions should apply for all missed months since last_time_added"""
        last_time = date.today().replace(month=max(1, date.today().month - 3), day=1)
        ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="deposit",
            scheduled_trans_details="Monthly Bonus",
            category="Salary",
            amount=50,
            currency=self.currency,
            date=1,
            last_time_added=last_time,
            status=True,
        )
        response = self.client.post(self.url, {}, format="json")
        applied = response.data["applied_count"]
        # Should apply at least for the 3 missed months + possibly current month
        self.assertTrue(applied >= 3)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["errors"], [])

    def test_apply_scheduled_transactions_no_scheduled(self):
        """Should succeed but not change networth if no scheduled transactions"""
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["applied_count"], 0)
        self.assertEqual(response.data["errors"], [])
        self.networth.refresh_from_db()
        self.assertEqual(float(self.networth.total), 1000)

    def test_apply_scheduled_transactions_unauthenticated(self):
        """Should fail if user is not authenticated"""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("finance_management.scheduled_trans_management.utils.apply_scheduled_transactions_fn")
    def test_apply_scheduled_transactions_internal_error(self, mock_apply_fn):
        """If util function raises exception, should return 500 with error"""
        mock_apply_fn.side_effect = Exception("Boom")
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data["success"])
        self.assertIn("Unexpected server error", response.data["errors"])

    def test_apply_scheduled_transactions_insufficient_funds(self):
        """Withdraw should fail if scheduled amount is greater than available"""
        ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="withdraw",
            scheduled_trans_details="Rent",
            category="Housing",
            amount=5000,
            currency=self.currency,
            date=1,
            last_time_added=None,
            status=True,
        )
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["applied_count"], 0)
        self.assertIn("Insufficient funds", response.data["errors"])
        self.networth.refresh_from_db()
        self.assertEqual(float(self.networth.total), 1000)

    def test_apply_scheduled_transactions_invalid_amount(self):
        """Negative or zero amounts should fail validation"""
        for bad_amount in [-50, 0]:
            ScheduledTransaction.objects.create(
                user=self.user,
                scheduled_trans_status="deposit",
                scheduled_trans_details="Bad input",
                category="Misc",
                amount=bad_amount,
                currency=self.currency,
                date=1,
                last_time_added=None,
                status=True,
            )
            response = self.client.post(self.url, {}, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data["success"])
            self.assertEqual(response.data["applied_count"], 0)
            self.assertIn("Invalid amount", response.data["errors"])

    def test_apply_scheduled_transactions_mixed_success_and_failures(self):
        """Should apply valid transactions and report errors for invalid ones"""
        # Valid
        ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="deposit",
            scheduled_trans_details="Bonus",
            category="Salary",
            amount=200,
            currency=self.currency,
            date=1,
            last_time_added=None,
            status=True,
        )
        # Invalid (insufficient funds)
        ScheduledTransaction.objects.create(
            user=self.user,
            scheduled_trans_status="withdraw",
            scheduled_trans_details="Luxury",
            category="Shopping",
            amount=5000,
            currency=self.currency,
            date=1,
            last_time_added=None,
            status=True,
        )
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["applied_count"], 1)
        self.assertIn("Insufficient funds", response.data["errors"])

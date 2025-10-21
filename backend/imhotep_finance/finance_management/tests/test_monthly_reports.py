from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from transaction_management.models import Transactions
from datetime import datetime, timedelta, date
from .mock_utils import MockAPITestCase


class GetMonthlyReportsViewTests(MockAPITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpassword123",
            favorite_currency="EUR"
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("get_monthly_reports")  # Make sure you set this name in urls.py

    def test_get_monthly_reports_no_transactions(self):
        """View should return empty report if user has no transactions"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["user_withdraw_on_range"], [])
        self.assertEqual(data["user_deposit_on_range"], [])
        self.assertEqual(data["total_withdraw"], 0.0)
        self.assertEqual(data["total_deposit"], 0.0)
        self.assertEqual(data["favorite_currency"], "EUR")
        self.assertIn("current_month", data)

    def test_get_monthly_reports_with_transactions(self):
        """View should return grouped transactions with percentages and totals"""
        today = date.today()

        # Withdraw transactions
        Transactions.objects.create(
            user=self.user, date=today, amount=100.0, currency="EUR",  # Use EUR to match user's favorite currency
            trans_status="withdraw", category="Food"
        )
        Transactions.objects.create(
            user=self.user, date=today, amount=50.0, currency="EUR",  # Use EUR to match user's favorite currency
            trans_status="withdraw", category="Transport"
        )

        # Deposit transactions
        Transactions.objects.create(
            user=self.user, date=today, amount=200.0, currency="EUR",  # Use EUR to match user's favorite currency
            trans_status="deposit", category="Salary"
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Withdraw checks
        self.assertEqual(data["total_withdraw"], 150.0)
        # Check that percentages exist and are reasonable
        withdraw_percentages = [item["percentage"] for item in data["user_withdraw_on_range"]]
        self.assertAlmostEqual(sum(withdraw_percentages), 100.0, places=1)

        # Deposit checks  
        self.assertEqual(data["total_deposit"], 200.0)
        deposit_percentages = [item["percentage"] for item in data["user_deposit_on_range"]]
        self.assertAlmostEqual(sum(deposit_percentages), 100.0, places=1)

        # Category grouping check
        withdraw_categories = [item["category"] for item in data["user_withdraw_on_range"]]
        self.assertIn("Food", withdraw_categories)
        self.assertIn("Transport", withdraw_categories)

    def test_unauthenticated_request_fails(self):
        """Request should fail if user is not authenticated"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

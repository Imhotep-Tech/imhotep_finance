from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from finance_management.models import Target, Transactions
from datetime import datetime, timedelta

User = get_user_model()


class TargetAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

        self.manage_target_url = reverse("manage_target")
        self.get_target_url = reverse("get_target")
        self.get_score_url = reverse("get_score")
        self.get_score_history_url = reverse("get_score_history")

    def test_manage_target_create_success(self):
        response = self.client.post(self.manage_target_url, {"target": 1000})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Target.objects.filter(user=self.user, target=1000).exists())

    def test_manage_target_update_success(self):
        Target.objects.create(user=self.user, target=500, month=datetime.now().month, year=datetime.now().year)
        response = self.client.post(self.manage_target_url, {"target": 1500})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Target.objects.get(user=self.user).target, 1500)

    def test_manage_target_invalid_input(self):
        response = self.client.post(self.manage_target_url, {"target": "abc"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_target_success(self):
        target = Target.objects.create(user=self.user, target=2000, month=datetime.now().month, year=datetime.now().year)
        response = self.client.get(self.get_target_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["target"], target.target)

    def test_get_target_not_found(self):
        response = self.client.get(self.get_target_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_score_success(self):
        # create target
        Target.objects.create(user=self.user, target=1000, month=datetime.now().month, year=datetime.now().year)
        # add transactions
        Transactions.objects.create(
            user=self.user,
            amount=500,
            currency="USD",
            trans_status="deposit",
            date=datetime.now()
        )
        Transactions.objects.create(
            user=self.user,
            amount=200,
            currency="USD",
            trans_status="withdraw",
            date=datetime.now()
        )
        response = self.client.get(self.get_score_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("score", response.data)
        self.assertIn("score_txt", response.data)

    def test_get_score_history_success(self):
        Target.objects.create(user=self.user, target=1000, month=datetime.now().month, year=datetime.now().year, score=50)
        response = self.client.get(self.get_score_history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("targets", response.data)
        self.assertIn("pagination", response.data)

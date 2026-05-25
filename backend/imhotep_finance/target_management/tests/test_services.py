from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date
from target_management.services import create_target_for_user, calculate_score
from target_management.models import Target
from transaction_management.services import create_transaction
from transaction_management.models import Transactions
User = get_user_model()

class CreateTargetServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_create_target_success(self):
        """Test creating a target successfully"""
        target = create_target_for_user(user=self.user, target_value=1000.0)
        self.assertIsNotNone(target.id)
        self.assertEqual(float(target.target), 1000.0)
        self.assertEqual(target.month, date.today().month)
        self.assertEqual(target.year, date.today().year)

    def test_update_existing_target(self):
        """Test updating an existing target for the same month"""
        first_target = create_target_for_user(user=self.user, target_value=1000.0)
        first_id = first_target.id
        updated_target = create_target_for_user(user=self.user, target_value=1500.0)
        self.assertEqual(first_id, updated_target.id)
        self.assertEqual(float(updated_target.target), 1500.0)
        self.assertEqual(Target.objects.filter(user=self.user).count(), 1)

    def test_create_target_invalid_value(self):
        """Test creating target with invalid value raises error"""
        with self.assertRaises(ValidationError):
            create_target_for_user(user=self.user, target_value=-100)
        with self.assertRaises(ValidationError):
            create_target_for_user(user=self.user, target_value=0)
        with self.assertRaises(ValidationError):
            create_target_for_user(user=self.user, target_value=None)

    def test_create_target_no_user(self):
        """Test creating target without user raises error"""
        with self.assertRaises(ValidationError):
            create_target_for_user(user=None, target_value=1000)

class CalculateScoreServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.target = create_target_for_user(user=self.user, target_value=1000.0)

    def test_calculate_score_no_transactions(self):
        """Test score calculation with no transactions"""
        target_obj, score_txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, -1000)
        self.assertIn('below target', score_txt.lower())

    def test_calculate_score_with_deposits(self):
        """Test score calculation with deposits only"""
        create_transaction(user=self.user, amount=500, currency='USD', trans_status='deposit', category='Salary', trans_details='', transaction_date=date.today(), place='General')
        create_transaction(user=self.user, amount=300, currency='USD', trans_status='deposit', category='Bonus', trans_details='', transaction_date=date.today(), place='General')
        target_obj, score_txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, -200)
        self.assertIn('below target', score_txt.lower())

    def test_calculate_score_with_deposits_and_withdrawals(self):
        """Test score calculation with both deposits and withdrawals"""
        create_transaction(user=self.user, amount=1500, currency='USD', trans_status='deposit', category='Salary', trans_details='', transaction_date=date.today(), place='General')
        create_transaction(user=self.user, amount=400, currency='USD', trans_status='withdraw', category='Rent', trans_details='', transaction_date=date.today(), place='General')
        target_obj, score_txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, 100)
        self.assertIn('above target', score_txt.lower())

    def test_calculate_score_updates_target(self):
        """Test that calculate_score updates the target's score field"""
        create_transaction(user=self.user, amount=750, currency='USD', trans_status='deposit', category='Salary', trans_details='', transaction_date=date.today(), place='General')
        calculate_score(user=self.user, target_obj=self.target)
        self.target.refresh_from_db()
        self.assertEqual(self.target.score, -250)

    def test_calculate_score_no_target(self):
        """Test calculate_score with no target raises error"""
        with self.assertRaises(Exception):
            calculate_score(user=self.user, target_obj=None)

    def test_score_text_ranges(self):
        """Test different score text ranges"""
        create_transaction(user=self.user, amount=1000, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')
        _, txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, 0)
        self.assertIn('on target', txt.lower())
        Transactions.objects.all().delete()
        Target.objects.all().delete()
        self.target = create_target_for_user(user=self.user, target_value=1000.0)
        create_transaction(user=self.user, amount=1500, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')
        _, txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, 500)
        self.assertIn('above target', txt.lower())
        Transactions.objects.all().delete()
        Target.objects.all().delete()
        self.target = create_target_for_user(user=self.user, target_value=1000.0)
        create_transaction(user=self.user, amount=500, currency='USD', trans_status='deposit', category='Test', trans_details='', transaction_date=date.today(), place='General')
        _, txt, score = calculate_score(user=self.user, target_obj=self.target)
        self.assertEqual(score, -500)
        self.assertIn('below target', txt.lower())
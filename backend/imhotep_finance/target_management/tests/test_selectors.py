from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date
from target_management.selectors import (
    get_target_for_user,
    get_all_targets_for_user,
    get_latest_target_for_user
)
from target_management.services import create_target_for_user

User = get_user_model()


class GetTargetForUserTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.target = create_target_for_user(user=self.user, target_value=1000.00)
    
    def test_get_target_current_month(self):
        """Test getting target for current month"""
        target = get_target_for_user(user=self.user)
        
        self.assertIsNotNone(target)
        self.assertEqual(target.id, self.target.id)
    
    def test_get_target_specific_month(self):
        """Test getting target for specific month and year"""
        today = date.today()
        target = get_target_for_user(
            user=self.user,
            month=today.month,
            year=today.year
        )
        
        self.assertIsNotNone(target)
        self.assertEqual(target.month, today.month)
        self.assertEqual(target.year, today.year)
    
    def test_get_target_nonexistent(self):
        """Test getting target that doesn't exist returns None"""
        target = get_target_for_user(user=self.user, month=1, year=2020)
        self.assertIsNone(target)


class GetAllTargetsForUserTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_get_all_targets_empty(self):
        """Test getting all targets when none exist"""
        targets = get_all_targets_for_user(user=self.user)
        self.assertEqual(targets.count(), 0)
    
    def test_get_all_targets_ordered(self):
        """Test that targets are ordered by date descending"""
        # Create multiple targets (would need to manually set different months)
        from target_management.models import Target
        
        Target.objects.create(
            user=self.user, target=1000, month=1, year=2024, score=0
        )
        Target.objects.create(
            user=self.user, target=1200, month=3, year=2024, score=0
        )
        Target.objects.create(
            user=self.user, target=1100, month=2, year=2024, score=0
        )
        
        targets = get_all_targets_for_user(user=self.user)
        
        self.assertEqual(targets.count(), 3)
        # Should be ordered by year desc, month desc
        self.assertEqual(targets[0].month, 3)
        self.assertEqual(targets[1].month, 2)
        self.assertEqual(targets[2].month, 1)


class GetLatestTargetForUserTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_get_latest_target(self):
        """Test getting the most recent target"""
        from target_management.models import Target
        
        Target.objects.create(
            user=self.user, target=1000, month=1, year=2024, score=0
        )
        latest = Target.objects.create(
            user=self.user, target=1500, month=3, year=2024, score=0
        )
        
        target = get_latest_target_for_user(user=self.user)
        
        self.assertEqual(target.id, latest.id)
        self.assertEqual(float(target.target), 1500)
    
    def test_get_latest_target_none(self):
        """Test getting latest target when none exist"""
        target = get_latest_target_for_user(user=self.user)
        self.assertIsNone(target)

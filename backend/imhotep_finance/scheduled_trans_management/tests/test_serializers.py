from django.test import TestCase
from decimal import Decimal
from scheduled_trans_management.serializers import ScheduledTransactionInputSerializer


class ScheduledTransactionInputSerializerTest(TestCase):

    def test_valid_data_lowercases_category(self):
        """Test that serializer trims and lowercases category"""
        data = {
            'day_of_month': 15,
            'amount': '250.00',
            'currency': 'USD',
            'scheduled_trans_status': 'Deposit',
            'category': '  Subscriptions & STREAMING  ',
            'scheduled_trans_details': 'Netflix'
        }
        serializer = ScheduledTransactionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['category'], 'subscriptions & streaming')
        self.assertEqual(serializer.validated_data['amount'], Decimal('250.00'))

    def test_none_category_allowed(self):
        """Test serializer with None category"""
        data = {
            'day_of_month': 1,
            'amount': '100.00',
            'currency': 'USD',
            'scheduled_trans_status': 'Withdraw',
            'category': None
        }
        serializer = ScheduledTransactionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get('category'))

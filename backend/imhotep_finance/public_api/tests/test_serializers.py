from django.test import TestCase
from rest_framework.exceptions import ValidationError
from public_api.serializers import ExternalTransactionCreateSerializer


class ExternalTransactionCreateSerializerTest(TestCase):
    def test_valid_data(self):
        """Test serializer with valid data"""
        data = {
            'amount': '100.50',
            'currency': 'USD',
            'trans_status': 'deposit',
            'category': 'Salary',
            'trans_details': 'Monthly payment'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_missing_required_fields(self):
        """Test serializer with missing required fields"""
        data = {
            'amount': '100'
            # Missing currency and trans_status
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('currency', serializer.errors)
        self.assertIn('trans_status', serializer.errors)

    def test_negative_amount(self):
        """Test serializer with negative amount"""
        data = {
            'amount': '-100',
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_zero_amount(self):
        """Test serializer with zero amount"""
        data = {
            'amount': '0',
            'currency': 'USD',
            'trans_status': 'deposit'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_invalid_currency(self):
        """Test serializer with invalid currency"""
        data = {
            'amount': '100',
            'currency': 'INVALID',
            'trans_status': 'deposit'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('currency', serializer.errors)

    def test_invalid_trans_status(self):
        """Test serializer with invalid transaction status"""
        data = {
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'invalid'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('trans_status', serializer.errors)

    def test_optional_fields(self):
        """Test serializer with optional fields"""
        data = {
            'amount': '100',
            'currency': 'USD',
            'trans_status': 'deposit',
            'date': '2024-01-15',
            'category': 'Food',
            'trans_details': 'Lunch'
        }

        serializer = ExternalTransactionCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['category'], 'Food')
        self.assertEqual(serializer.validated_data['trans_details'], 'Lunch')

    def test_deposit_and_withdraw_status(self):
        """Test serializer accepts both deposit and withdraw"""
        for status in ['Deposit', 'deposit', 'Withdraw', 'withdraw']:
            data = {
                'amount': '100',
                'currency': 'USD',
                'trans_status': status
            }

            serializer = ExternalTransactionCreateSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Status {status} should be valid")

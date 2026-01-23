from django.test import TestCase
from target_management.serializers import (
    TargetCreateSerializer,
    TargetResponseSerializer,
    GetScoreResponseSerializer
)
from decimal import Decimal


class TargetCreateSerializerTest(TestCase):
    def test_valid_data(self):
        """Test serializer with valid data"""
        data = {'target': '1000.50'}
        serializer = TargetCreateSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['target'], Decimal('1000.50'))
    
    def test_invalid_negative_target(self):
        """Test serializer rejects negative target"""
        data = {'target': '-100'}
        serializer = TargetCreateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('target', serializer.errors)
    
    def test_invalid_zero_target(self):
        """Test serializer rejects zero target"""
        data = {'target': '0'}
        serializer = TargetCreateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('target', serializer.errors)
    
    def test_missing_target(self):
        """Test serializer rejects missing target"""
        data = {}
        serializer = TargetCreateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('target', serializer.errors)


class TargetResponseSerializerTest(TestCase):
    def test_serialization(self):
        """Test response serializer output"""
        from datetime import datetime
        
        data = {
            'id': 1,
            'user_id': 1,
            'target': Decimal('1000.00'),
            'month': 6,
            'year': 2024,
            'score': Decimal('75.50'),
            'created_at': datetime.now()
        }
        
        serializer = TargetResponseSerializer(data)
        self.assertIn('id', serializer.data)
        self.assertIn('target', serializer.data)
        self.assertIn('score', serializer.data)


class GetScoreResponseSerializerTest(TestCase):
    def test_score_response_serialization(self):
        """Test score response serializer"""
        data = {
            'score': Decimal('85.00'),
            'target': Decimal('1000.00'),
            'month': 6,
            'year': 2024,
            'score_txt': 'Great job!'
        }
        
        serializer = GetScoreResponseSerializer(data)
        self.assertIn('score', serializer.data)
        self.assertIn('score_txt', serializer.data)
        self.assertEqual(serializer.data['score_txt'], 'Great job!')

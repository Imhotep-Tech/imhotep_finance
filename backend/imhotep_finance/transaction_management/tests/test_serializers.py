from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from transaction_management.serializers import (
    TransactionInputSerializer,
    TransactionUpdateSerializer,
    TransactionFilterSerializer,
    CSVFileUploadSerializer
)
from decimal import Decimal


class TransactionInputSerializerTest(TestCase):
    def test_valid_data(self):
        """Test serializer with valid data"""
        data = {
            'amount': '100.50',
            'currency': 'USD',
            'trans_status': 'deposit',
            'category': 'Salary',
            'trans_details': 'Monthly payment'
        }
        
        serializer = TransactionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['amount'], Decimal('100.50'))
    
    def test_invalid_amount_zero(self):
        """Test serializer rejects zero amount"""
        data = {
            'amount': '0',
            'currency': 'USD',
            'trans_status': 'deposit'
        }
        
        serializer = TransactionInputSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)
    
    def test_invalid_amount_negative(self):
        """Test serializer rejects negative amount"""
        data = {
            'amount': '-50',
            'currency': 'USD',
            'trans_status': 'deposit'
        }
        
        serializer = TransactionInputSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_missing_required_fields(self):
        """Test serializer rejects missing required fields"""
        data = {
            'amount': '100'
        }
        
        serializer = TransactionInputSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('currency', serializer.errors)
        self.assertIn('trans_status', serializer.errors)


class TransactionFilterSerializerTest(TestCase):
    def test_valid_filter_data(self):
        """Test filter serializer with valid data"""
        data = {
            'start_date': '2024-01-01',
            'end_date': '2024-01-31',
            'category': 'Food',
            'trans_status': 'deposit',
            'page': '1'
        }
        
        serializer = TransactionFilterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_optional_fields(self):
        """Test filter serializer with optional fields omitted"""
        data = {}
        
        serializer = TransactionFilterSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class CSVFileUploadSerializerTest(TestCase):
    def test_valid_csv_file(self):
        """Test valid CSV file upload"""
        csv_content = b"date,amount,currency,trans_status\n2024-01-15,100,USD,deposit\n"
        csv_file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        data = {'file': csv_file}
        serializer = CSVFileUploadSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_invalid_file_extension(self):
        """Test rejection of non-CSV file"""
        txt_file = SimpleUploadedFile("test.txt", b"content", content_type="text/plain")
        
        data = {'file': txt_file}
        serializer = CSVFileUploadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)
    
    def test_empty_file(self):
        """Test rejection of empty file"""
        empty_file = SimpleUploadedFile("test.csv", b"", content_type="text/csv")
        
        data = {'file': empty_file}
        serializer = CSVFileUploadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_missing_required_columns(self):
        """Test rejection of CSV with missing columns"""
        csv_content = b"date,amount\n2024-01-15,100\n"
        csv_file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        data = {'file': csv_file}
        serializer = CSVFileUploadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)

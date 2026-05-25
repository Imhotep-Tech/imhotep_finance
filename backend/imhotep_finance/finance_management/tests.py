from django.test import TestCase
from accounts.models import User
from transaction_management.models import Transactions, NetWorth
from datetime import date
from .utils.recalculate_networth import recalculate_networth

class RecalculateNetworthTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

    def test_recalculate_networth_cleans_dirty_places(self):
        """Test that recalculate_networth cleans up dirty place names and groups them correctly"""
        # Create raw transactions with dirty places
        # Note: We create them directly using Transactions.objects.create to bypass the clean logic in create_transaction service
        Transactions.objects.create(user=self.user, amount=100, currency='USD', trans_status='deposit', category='Test', date=date.today(), place='   office  ')
        Transactions.objects.create(user=self.user, amount=50, currency='USD', trans_status='deposit', category='Test', date=date.today(), place='OFFICE')
        Transactions.objects.create(user=self.user, amount=20, currency='USD', trans_status='withdraw', category='Test', date=date.today(), place='office ')
        
        # Another currency with empty place
        Transactions.objects.create(user=self.user, amount=200, currency='EUR', trans_status='deposit', category='Test', date=date.today(), place='   ')
        
        success, data = recalculate_networth(self.user)
        self.assertTrue(success)
        
        # Verify that all 'office' variations were grouped into 'Office'
        networth_office = NetWorth.objects.get(user=self.user, currency='USD', place='Office')
        self.assertEqual(float(networth_office.total), 130)  # 100 + 50 - 20
        
        # Verify that the empty place was grouped into 'General'
        networth_general = NetWorth.objects.get(user=self.user, currency='EUR', place='General')
        self.assertEqual(float(networth_general.total), 200)

        # Verify that the database was cleaned
        self.assertFalse(Transactions.objects.filter(place='   office  ').exists())
        self.assertEqual(Transactions.objects.filter(place='Office').count(), 3)
        self.assertEqual(Transactions.objects.filter(place='General').count(), 1)

    def test_recalculate_networth_empty_db(self):
        """Test recalculate_networth on an empty database"""
        success, data = recalculate_networth(self.user)
        self.assertTrue(success)
        self.assertEqual(data['networth_records_created'], 0)

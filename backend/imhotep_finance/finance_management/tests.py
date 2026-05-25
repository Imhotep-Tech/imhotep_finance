from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
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


class MoveMoneyApiTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        
        # Set up initial balances
        NetWorth.objects.create(user=self.user, currency='USD', place='Cash', total=1000.0)
        NetWorth.objects.create(user=self.user, currency='USD', place='Bank', total=500.0)
        
        self.url = reverse('move_money')

    def test_move_money_to_existing_place_success(self):
        """Test moving money between two existing places successfully"""
        payload = {
            'source_place': 'Cash',
            'target_place': 'Bank',
            'amount': 300.0,
            'currency': 'USD'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['message'], 'Money moved successfully')
        
        # Verify NetWorth updates
        cash_nw = NetWorth.objects.get(user=self.user, currency='USD', place='Cash')
        bank_nw = NetWorth.objects.get(user=self.user, currency='USD', place='Bank')
        self.assertEqual(cash_nw.total, 700.0)
        self.assertEqual(bank_nw.total, 800.0)
        
        # Verify Transactions were created
        withdrawals = Transactions.objects.filter(user=self.user, place='Cash', trans_status='Withdraw')
        deposits = Transactions.objects.filter(user=self.user, place='Bank', trans_status='Deposit')
        self.assertEqual(withdrawals.count(), 1)
        self.assertEqual(deposits.count(), 1)
        self.assertEqual(withdrawals.first().amount, 300.0)
        self.assertEqual(deposits.first().amount, 300.0)
        self.assertEqual(withdrawals.first().category, 'Transfer')
        self.assertEqual(deposits.first().category, 'Transfer')

    def test_move_money_to_new_place_success(self):
        """Test moving money to a target place that doesn't exist yet"""
        payload = {
            'source_place': 'Cash',
            'target_place': 'Office',
            'amount': 200.0,
            'currency': 'USD'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, 200)
        
        # Verify NetWorth updates
        cash_nw = NetWorth.objects.get(user=self.user, currency='USD', place='Cash')
        office_nw = NetWorth.objects.get(user=self.user, currency='USD', place='Office')
        self.assertEqual(cash_nw.total, 800.0)
        self.assertEqual(office_nw.total, 200.0)

    def test_move_money_same_place_fails(self):
        """Test that moving money to the exact same place raises validation error"""
        payload = {
            'source_place': 'Cash',
            'target_place': 'Cash',
            'amount': 100.0,
            'currency': 'USD'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn("Source and target places must be different", str(res.data))

    def test_move_money_insufficient_funds_fails(self):
        """Test that moving more money than available in source place fails"""
        payload = {
            'source_place': 'Cash',
            'target_place': 'Bank',
            'amount': 1500.0,
            'currency': 'USD'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn("Insufficient funds", str(res.data))

    def test_move_money_non_existent_source_fails(self):
        """Test that moving money from a non-existent source place/currency combination fails"""
        payload = {
            'source_place': 'Credit Card',
            'target_place': 'Bank',
            'amount': 100.0,
            'currency': 'USD'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn("does not exist", str(res.data))

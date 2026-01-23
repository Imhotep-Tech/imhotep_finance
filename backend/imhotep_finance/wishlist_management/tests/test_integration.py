from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from wishlist_management.services import create_wish, update_wish_status
from transaction_management.models import Transactions, NetWorth
from wishlist_management.models import Wishlist

User = get_user_model()


class WishlistTransactionIntegrationTest(TransactionTestCase):
    """Integration tests for wishlist and transaction interaction"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        NetWorth.objects.create(user=self.user, currency='USD', total=1000)
    
    def test_complete_wishlist_lifecycle(self):
        """Test create, purchase, and unpurchase wish flow"""
        # Create wish
        wish = create_wish(
            user=self.user,
            price=300,
            currency='USD',
            year=2024,
            wish_details='Test item',
            link=''
        )
        
        self.assertFalse(wish.status)
        self.assertIsNone(wish.transaction)
        
        # Mark as purchased
        wish = update_wish_status(user=self.user, wish_id=wish.id)
        
        self.assertTrue(wish.status)
        self.assertIsNotNone(wish.transaction)
        
        # Verify transaction created
        self.assertEqual(Transactions.objects.filter(user=self.user).count(), 1)
        transaction = Transactions.objects.first()
        self.assertEqual(float(transaction.amount), 300)
        
        # Verify networth updated
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 700)
        
        # Unmark as purchased
        wish = update_wish_status(user=self.user, wish_id=wish.id)
        
        self.assertFalse(wish.status)
        self.assertIsNone(wish.transaction)
        
        # Verify transaction deleted
        self.assertEqual(Transactions.objects.filter(user=self.user).count(), 0)
        
        # Verify networth restored
        networth.refresh_from_db()
        self.assertEqual(float(networth.total), 1000)
    
    def test_multiple_wishes_purchase(self):
        """Test purchasing multiple wishes"""
        # Create multiple wishes
        wish1 = create_wish(user=self.user, price=200, currency='USD', year=2024, wish_details='Item 1', link='')
        wish2 = create_wish(user=self.user, price=150, currency='USD', year=2024, wish_details='Item 2', link='')
        
        # Purchase both
        update_wish_status(user=self.user, wish_id=wish1.id)
        update_wish_status(user=self.user, wish_id=wish2.id)
        
        # Verify networth
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 650)  # 1000 - 200 - 150
        
        # Verify transactions
        self.assertEqual(Transactions.objects.filter(user=self.user).count(), 2)

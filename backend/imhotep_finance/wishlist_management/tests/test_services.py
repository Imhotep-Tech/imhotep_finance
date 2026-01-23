from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import date
from wishlist_management.services import (
    create_wish,
    delete_wish,
    update_wish,
    update_wish_status
)
from wishlist_management.models import Wishlist
from transaction_management.models import Transactions, NetWorth

User = get_user_model()


class CreateWishServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
    
    def test_create_wish_success(self):
        """Test creating a wish successfully"""
        wish = create_wish(
            user=self.user,
            price=500.00,
            currency='USD',
            year=2024,
            wish_details='New laptop',
            link='https://example.com'
        )
        
        self.assertIsNotNone(wish.id)
        self.assertEqual(float(wish.price), 500.00)
        self.assertEqual(wish.currency, 'USD')
        self.assertEqual(wish.year, 2024)
        self.assertFalse(wish.status)  # Should be pending by default
    
    def test_create_wish_without_year(self):
        """Test creating wish without year uses current year"""
        wish = create_wish(
            user=self.user,
            price=300.00,
            currency='USD',
            year=None,
            wish_details='New phone',
            link=''
        )
        
        self.assertEqual(wish.year, date.today().year)
    
    def test_create_wish_invalid_price(self):
        """Test creating wish with invalid price raises error"""
        with self.assertRaises(ValidationError):
            create_wish(
                user=self.user,
                price=-100,
                currency='USD',
                year=2024,
                wish_details='Test',
                link=''
            )
        
        with self.assertRaises(ValidationError):
            create_wish(
                user=self.user,
                price=0,
                currency='USD',
                year=2024,
                wish_details='Test',
                link=''
            )
    
    def test_create_wish_no_user(self):
        """Test creating wish without user raises error"""
        with self.assertRaises(ValidationError):
            create_wish(
                user=None,
                price=100,
                currency='USD',
                year=2024,
                wish_details='Test',
                link=''
            )
    
    def test_create_wish_invalid_currency(self):
        """Test creating wish with invalid currency"""
        with self.assertRaises(ValidationError):
            create_wish(
                user=self.user,
                price=100,
                currency='INVALID',
                year=2024,
                wish_details='Test',
                link=''
            )


class DeleteWishServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.wish = create_wish(
            user=self.user,
            price=500.00,
            currency='USD',
            year=2024,
            wish_details='Test wish',
            link=''
        )
    
    def test_delete_wish_success(self):
        """Test deleting a pending wish successfully"""
        wish_id = self.wish.id
        delete_wish(user=self.user, wish_id=wish_id)
        
        self.assertFalse(Wishlist.objects.filter(id=wish_id).exists())
    
    def test_delete_purchased_wish_fails(self):
        """Test deleting purchased wish raises error"""
        # Mark wish as purchased
        self.wish.status = True
        self.wish.save()
        
        with self.assertRaises(ValidationError) as context:
            delete_wish(user=self.user, wish_id=self.wish.id)
        self.assertIn('pending', str(context.exception).lower())


class UpdateWishServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.wish = create_wish(
            user=self.user,
            price=500.00,
            currency='USD',
            year=2024,
            wish_details='Original wish',
            link='https://example.com'
        )
    
    def test_update_wish_success(self):
        """Test updating wish successfully"""
        updated_wish = update_wish(
            user=self.user,
            wish_id=self.wish.id,
            price=600.00,
            currency='EUR',
            year=2025,
            wish_details='Updated wish',
            link='https://updated.com'
        )
        
        self.assertEqual(float(updated_wish.price), 600.00)
        self.assertEqual(updated_wish.currency, 'EUR')
        self.assertEqual(updated_wish.year, 2025)
        self.assertEqual(updated_wish.wish_details, 'Updated wish')
    
    def test_update_purchased_wish_fails(self):
        """Test updating purchased wish raises error"""
        self.wish.status = True
        self.wish.save()
        
        with self.assertRaises(ValidationError) as context:
            update_wish(
                user=self.user,
                wish_id=self.wish.id,
                price=600.00,
                currency='USD',
                year=2024,
                wish_details='Updated',
                link=''
            )
        self.assertIn('pending', str(context.exception).lower())


class UpdateWishStatusServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        # Create networth for user
        NetWorth.objects.create(user=self.user, currency='USD', total=1000)
        
        self.wish = create_wish(
            user=self.user,
            price=200.00,
            currency='USD',
            year=2024,
            wish_details='Test wish',
            link=''
        )
    
    def test_mark_wish_as_purchased(self):
        """Test marking wish as purchased creates transaction"""
        updated_wish = update_wish_status(user=self.user, wish_id=self.wish.id)
        
        self.assertTrue(updated_wish.status)
        self.assertIsNotNone(updated_wish.transaction)
        
        # Verify transaction was created
        transaction = Transactions.objects.get(id=updated_wish.transaction.id)
        self.assertEqual(float(transaction.amount), 200.00)
        self.assertEqual(transaction.trans_status.lower(), 'withdraw')
        self.assertEqual(transaction.category, 'Wishes')
        
        # Verify networth was updated
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 800.00)  # 1000 - 200
    
    def test_mark_wish_as_not_purchased(self):
        """Test unmarking wish reverses transaction"""
        # First mark as purchased
        update_wish_status(user=self.user, wish_id=self.wish.id)
        
        # Then unmark
        updated_wish = update_wish_status(user=self.user, wish_id=self.wish.id)
        
        self.assertFalse(updated_wish.status)
        self.assertIsNone(updated_wish.transaction)
        
        # Verify networth was restored
        networth = NetWorth.objects.get(user=self.user, currency='USD')
        self.assertEqual(float(networth.total), 1000.00)  # Back to original
    
    def test_insufficient_funds(self):
        """Test purchasing wish with insufficient funds"""
        # Create wish more expensive than networth
        expensive_wish = create_wish(
            user=self.user,
            price=2000.00,
            currency='USD',
            year=2024,
            wish_details='Expensive',
            link=''
        )
        
        with self.assertRaises(ValidationError) as context:
            update_wish_status(user=self.user, wish_id=expensive_wish.id)
        self.assertIn('insufficient', str(context.exception).lower())

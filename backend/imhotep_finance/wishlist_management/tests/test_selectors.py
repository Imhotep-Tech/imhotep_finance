from django.test import TestCase
from django.contrib.auth import get_user_model
from wishlist_management.selectors import get_wishlist_for_user
from wishlist_management.services import create_wish

User = get_user_model()


class GetWishlistForUserTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        
        # Create wishes for different years
        self.wish_2024 = create_wish(
            user=self.user,
            price=500,
            currency='USD',
            year=2024,
            wish_details='2024 wish',
            link=''
        )
        
        self.wish_2025 = create_wish(
            user=self.user,
            price=300,
            currency='USD',
            year=2025,
            wish_details='2025 wish',
            link=''
        )
    
    def test_get_wishlist_filtered_by_year(self):
        """Test getting wishlist filtered by year"""
        wishlist = get_wishlist_for_user(user=self.user, year=2024)
        
        self.assertEqual(wishlist.count(), 1)
        self.assertEqual(wishlist.first().year, 2024)
    
    def test_get_wishlist_all_years(self):
        """Test getting wishlist without year filter"""
        wishlist = get_wishlist_for_user(user=self.user, year=None)
        
        self.assertEqual(wishlist.count(), 2)
    
    def test_wishlist_ordered_by_date(self):
        """Test wishlist is ordered by creation date descending"""
        wishlist = get_wishlist_for_user(user=self.user, year=None)
        
        dates = [wish.created_at for wish in wishlist]
        self.assertEqual(dates, sorted(dates, reverse=True))

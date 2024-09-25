import unittest
from app import db, app

class TestTrashWishlist(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.client = app.test_client()

    def test_empty_trash_wishlist(self):
        # Simulate a user login
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1  # Assuming user_id 1 exists in the database

        # Execute the code to fetch trash wishlist data
        trash_wishlist_data = db.session.execute(
            text("SELECT * FROM wishlist_trash WHERE user_id = :user_id"),
            {"user_id": 1}
        ).fetchall()

        # Assert that the returned list is empty
        self.assertEqual(trash_wishlist_data, [])

if __name__ == '__main__':
    unittest.main()
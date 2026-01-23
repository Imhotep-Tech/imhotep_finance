from django.test import TestCase
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch, MagicMock
from accounts.models import User
from accounts.services import (
    login_user,
    demo_login,
    register_user,
    verify_email,
    logout_user,
    request_password_reset,
    confirm_password_reset,
    validate_password_reset_token,
    update_user_profile,
    change_user_password,
    verify_email_change,
    get_google_oauth_url,
    authenticate_with_google
)


class LoginUserServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=True
        )

    def test_login_with_username_success(self):
        user, message = login_user('testuser', 'testpass123')
        self.assertIsNotNone(user)
        self.assertEqual(message, 'Login successful')

    def test_login_with_email_success(self):
        user, message = login_user('test@example.com', 'testpass123')
        self.assertIsNotNone(user)
        self.assertEqual(message, 'Login successful')

    def test_login_with_invalid_credentials(self):
        user, message = login_user('testuser', 'wrongpass')
        self.assertIsNone(user)
        self.assertEqual(message, 'Invalid credentials')

    def test_login_with_unverified_email(self):
        unverified_user = User.objects.create_user(
            username='unverified',
            email='unverified@example.com',
            password='testpass123',
            email_verify=False
        )
        with patch('accounts.services.send_mail'):
            user, message = login_user('unverified', 'testpass123')
            self.assertIsNotNone(user)
            self.assertIn('Email not verified', message)

    def test_login_without_credentials(self):
        user, message = login_user('', '')
        self.assertIsNone(user)
        self.assertEqual(message, 'Username/email and password are required')


class DemoLoginServiceTests(TestCase):
    def test_demo_login_creates_user_if_not_exists(self):
        user = demo_login('demo', 'demo@imhotep.tech', 'demo_password_123!')
        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'demo')
        self.assertTrue(user.email_verify)

    def test_demo_login_returns_existing_user(self):
        User.objects.create_user(
            username='demo',
            email='demo@imhotep.tech',
            password='demo_password_123!'
        )
        user = demo_login('demo', 'demo@imhotep.tech', 'demo_password_123!')
        self.assertIsNotNone(user)
        self.assertEqual(User.objects.filter(username='demo').count(), 1)


class RegisterUserServiceTests(TestCase):
    @patch('accounts.services.send_mail')
    def test_register_user_success(self, mock_send_mail):
        user, message = register_user(
            'newuser',
            'newuser@example.com',
            'testpass123',
            'John',
            'Doe'
        )
        self.assertIsNotNone(user)
        self.assertIn('Verification email sent', message)
        self.assertEqual(user.username, 'newuser')
        self.assertFalse(user.email_verify)

    def test_register_user_duplicate_username(self):
        User.objects.create_user(username='existinguser', email='existing@example.com')
        user, message = register_user('existinguser', 'new@example.com', 'testpass123')
        self.assertIsNone(user)
        self.assertIn('already taken', message)

    def test_register_user_duplicate_email(self):
        User.objects.create_user(username='user1', email='duplicate@example.com')
        user, message = register_user('user2', 'duplicate@example.com', 'testpass123')
        self.assertIsNone(user)
        self.assertIn('already registered', message)


class VerifyEmailServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=False
        )
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

    @patch('accounts.services.send_mail')
    def test_verify_email_success(self, mock_send_mail):
        result = verify_email(self.uid, self.token)
        self.assertTrue(result)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verify)
        self.assertTrue(self.user.is_active)

    def test_verify_email_invalid_token(self):
        result = verify_email(self.uid, 'invalid-token')
        self.assertFalse(result)


class PasswordResetServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )

    @patch('accounts.services.send_mail')
    def test_request_password_reset_success(self, mock_send_mail):
        success, message = request_password_reset('test@example.com')
        self.assertTrue(success)
        self.assertIn('password reset link has been sent', message)
        mock_send_mail.assert_called_once()

    @patch('accounts.services.send_mail')
    def test_request_password_reset_nonexistent_email(self, mock_send_mail):
        success, message = request_password_reset('nonexistent@example.com')
        self.assertTrue(success)  # Returns success for security
        self.assertIn('password reset link has been sent', message)

    def test_confirm_password_reset_success(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        success, message = confirm_password_reset(uid, token, 'NewPass123!')
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!'))

    def test_confirm_password_reset_invalid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        success, message = confirm_password_reset(uid, 'invalid-token', 'NewPass123!')
        self.assertFalse(success)
        self.assertIn('Invalid or expired', message)

    def test_validate_password_reset_token_valid(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        valid, message, email = validate_password_reset_token(uid, token)
        self.assertTrue(valid)
        self.assertEqual(email, self.user.email)

    def test_validate_password_reset_token_invalid(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        valid, message, email = validate_password_reset_token(uid, 'invalid-token')
        self.assertFalse(valid)
        self.assertIsNone(email)


class ProfileServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )

    def test_update_user_profile_first_name(self):
        user, message = update_user_profile(self.user, first_name='Jane')
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, 'Jane')
        self.assertIn('First name updated', message)

    def test_update_user_profile_username(self):
        user, message = update_user_profile(self.user, username='newusername')
        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'newusername')
        self.assertIn('Username updated', message)

    def test_update_user_profile_duplicate_username(self):
        User.objects.create_user(username='taken', email='taken@example.com')
        user, message = update_user_profile(self.user, username='taken')
        self.assertIsNone(user)
        self.assertIn('already taken', message)

    @patch('accounts.services.send_mail')
    def test_update_user_profile_email(self, mock_send_mail):
        user, message = update_user_profile(self.user, email='newemail@example.com')
        self.assertIsNotNone(user)
        self.assertIn('Email verification sent', message)
        mock_send_mail.assert_called_once()

    def test_update_demo_user_profile_denied(self):
        demo_user = User.objects.create_user(username='demo', email='demo@example.com')
        user, message = update_user_profile(demo_user, first_name='Test')
        self.assertIsNone(user)
        self.assertIn('Demo user cannot', message)

    def test_change_user_password_success(self):
        success, message = change_user_password(self.user, 'testpass123', 'NewPass123!')
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!'))

    def test_change_user_password_wrong_current(self):
        success, message = change_user_password(self.user, 'wrongpass', 'NewPass123!')
        self.assertFalse(success)
        self.assertIn('Current password is incorrect', message)

    def test_change_demo_user_password_denied(self):
        demo_user = User.objects.create_user(username='demo', email='demo@example.com')
        success, message = change_user_password(demo_user, 'pass', 'NewPass123!')
        self.assertFalse(success)
        self.assertIn('Demo user cannot', message)

    def test_verify_email_change_success(self):
        new_email = 'newemail@example.com'
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        new_email_encoded = urlsafe_base64_encode(force_bytes(new_email))
        
        success, message = verify_email_change(uid, token, new_email_encoded)
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, new_email)


class GoogleAuthServiceTests(TestCase):
    def test_get_google_oauth_url(self):
        url = get_google_oauth_url()
        self.assertIn('accounts.google.com', url)
        self.assertIn('client_id', url)

    @patch('accounts.services.requests.post')
    @patch('accounts.services.requests.get')
    @patch('accounts.services.send_mail')
    def test_authenticate_with_google_new_user(self, mock_send_mail, mock_get, mock_post):
        # Mock token exchange
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {'access_token': 'test_token'}
        )
        # Mock user info
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'email': 'newuser@gmail.com',
                'given_name': 'New',
                'family_name': 'User'
            }
        )
        
        user, message, is_new_user = authenticate_with_google('test_code')
        self.assertIsNotNone(user)
        self.assertTrue(is_new_user)
        self.assertTrue(user.email_verify)

    @patch('accounts.services.requests.post')
    @patch('accounts.services.requests.get')
    def test_authenticate_with_google_existing_user(self, mock_get, mock_post):
        existing_user = User.objects.create_user(
            username='existing',
            email='existing@gmail.com',
            email_verify=True
        )
        
        # Mock token exchange
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {'access_token': 'test_token'}
        )
        # Mock user info
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'email': 'existing@gmail.com',
                'given_name': 'Existing',
                'family_name': 'User'
            }
        )
        
        user, message, is_new_user = authenticate_with_google('test_code')
        self.assertIsNotNone(user)
        self.assertFalse(is_new_user)
        self.assertEqual(user.id, existing_user.id)

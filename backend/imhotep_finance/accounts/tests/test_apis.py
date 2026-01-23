from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch
from accounts.models import User


class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=True
        )

    def test_login_with_username(self):
        response = self.client.post(reverse('login'), {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_email(self):
        response = self.client.post(reverse('login'), {
            'username': 'test@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials(self):
        response = self.client.post(reverse('login'), {
            'username': 'testuser',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_demo_login(self):
        response = self.client.post(reverse('demo_login'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertTrue(User.objects.filter(username='demo').exists())

    @patch('accounts.services.send_mail')
    def test_register_user(self, mock_send_mail):
        response = self.client.post(reverse('register'), {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_duplicate_username(self):
        response = self.client.post(reverse('register'), {
            'username': 'testuser',
            'email': 'another@example.com',
            'password': 'testpass123',
            'password2': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.post(reverse('logout'), {
            'refresh': str(refresh)
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PasswordResetAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )

    @patch('accounts.services.send_mail')
    def test_password_reset_request(self, mock_send_mail):
        response = self.client.post(reverse('password_reset_request'), {
            'email': 'test@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()

    def test_password_reset_confirm(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        
        response = self.client.post(reverse('password_reset_confirm'), {
            'uid': uid,
            'token': token,
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!'))

    def test_password_reset_validate(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        
        response = self.client.post(reverse('password_reset_validate'), {
            'uid': uid,
            'token': token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])


class ProfileAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            email_verify=True
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_get_profile(self):
        response = self.client.get(reverse('get_profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_update_profile_first_name(self):
        response = self.client.put(reverse('update_profile'), {
            'first_name': 'Jane'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Jane')

    def test_update_profile_username(self):
        response = self.client.put(reverse('update_profile'), {
            'username': 'newusername'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'newusername')

    def test_change_password(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'testpass123',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!'))

    def test_change_password_wrong_current(self):
        response = self.client.post(reverse('change_password'), {
            'current_password': 'wrongpass',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserDataAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            email_verify=True
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_get_user_data(self):
        response = self.client.get(reverse('user_data'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_get_user_data_unauthorized(self):
        self.client.credentials()
        response = self.client.get(reverse('user_data'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GoogleAuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_google_login_url(self):
        response = self.client.get(reverse('google_login_url'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('auth_url', response.data)
        self.assertIn('accounts.google.com', response.data['auth_url'])

    @patch('accounts.apis.authenticate_with_google')
    def test_google_auth_success(self, mock_authenticate):
        user = User.objects.create_user(
            username='googleuser',
            email='google@example.com',
            email_verify=True
        )
        mock_authenticate.return_value = (user, 'Success', False)
        
        response = self.client.post(reverse('google_auth'), {
            'code': 'test_auth_code'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    @patch('accounts.apis.authenticate_with_google')
    def test_google_auth_failure(self, mock_authenticate):
        mock_authenticate.return_value = (None, 'Failed to authenticate', False)
        
        response = self.client.post(reverse('google_auth'), {
            'code': 'invalid_code'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

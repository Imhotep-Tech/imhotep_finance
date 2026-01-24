from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from oauth2_provider.models import Application
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CreateOAuth2ApplicationApiTest(TestCase):
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
        self.url = reverse('create_oauth2_application')

    def test_create_oauth2_application_success(self):
        """Test creating OAuth2 application via API"""
        data = {
            'name': 'My Todo App',
            'client_type': 'confidential',
            'authorization_grant_type': 'authorization-code',
            'redirect_uris': 'https://myapp.com/callback',
            'skip_authorization': False
        }

        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('client_id', response.data)
        self.assertIn('client_secret', response.data)
        self.assertEqual(response.data['name'], 'My Todo App')
        self.assertTrue(Application.objects.filter(user=self.user, name='My Todo App').exists())

    def test_create_oauth2_application_unauthenticated(self):
        """Test creating OAuth2 application without authentication"""
        self.client.credentials()
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback'
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_oauth2_application_invalid_redirect_uri(self):
        """Test creating OAuth2 application with invalid redirect URI"""
        data = {
            'name': 'My App',
            'redirect_uris': 'invalid-uri'
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('redirect_uris', str(response.data))

    def test_create_oauth2_application_multiple_redirect_uris(self):
        """Test creating OAuth2 application with multiple redirect URIs"""
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback\nhttps://myapp.com/callback2'
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        app = Application.objects.get(user=self.user, name='My App')
        self.assertIn('https://myapp.com/callback', app.redirect_uris)
        self.assertIn('https://myapp.com/callback2', app.redirect_uris)

    def test_create_oauth2_application_missing_name(self):
        """Test creating OAuth2 application without name"""
        data = {
            'redirect_uris': 'https://myapp.com/callback'
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ListOAuth2ApplicationsApiTest(TestCase):
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
        self.url = reverse('list_oauth2_applications')

        # Create test applications
        Application.objects.create(
            name='App 1',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://app1.com/callback'
        )
        Application.objects.create(
            name='App 2',
            user=self.user,
            client_type='public',
            authorization_grant_type='authorization-code',
            redirect_uris='https://app2.com/callback'
        )

    def test_list_oauth2_applications(self):
        """Test listing OAuth2 applications"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'App 2')  # Ordered by -created
        self.assertIn('client_id', response.data[0])
        self.assertNotIn('client_secret', response.data[0])  # Secret not shown in list

    def test_list_oauth2_applications_unauthenticated(self):
        """Test listing OAuth2 applications without authentication"""
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_oauth2_applications_empty(self):
        """Test listing OAuth2 applications when user has none"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class GetOAuth2ApplicationApiTest(TestCase):
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

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )

    def test_get_oauth2_application_success(self):
        """Test getting OAuth2 application details"""
        url = reverse('get_oauth2_application', kwargs={'application_id': self.application.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'My App')
        self.assertIn('client_id', response.data)
        self.assertNotIn('client_secret', response.data)  # Secret not shown

    def test_get_oauth2_application_not_found(self):
        """Test getting non-existent OAuth2 application"""
        url = reverse('get_oauth2_application', kwargs={'application_id': 99999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_oauth2_application_other_user(self):
        """Test getting OAuth2 application belonging to another user"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        other_app = Application.objects.create(
            name='Other App',
            user=other_user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://other.com/callback'
        )

        url = reverse('get_oauth2_application', kwargs={'application_id': other_app.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DeleteOAuth2ApplicationApiTest(TestCase):
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

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )

    def test_delete_oauth2_application_success(self):
        """Test deleting OAuth2 application"""
        url = reverse('delete_oauth2_application', kwargs={'application_id': self.application.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Application.objects.filter(id=self.application.id).exists())

    def test_delete_oauth2_application_not_found(self):
        """Test deleting non-existent OAuth2 application"""
        url = reverse('delete_oauth2_application', kwargs={'application_id': 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_oauth2_application_other_user(self):
        """Test deleting OAuth2 application belonging to another user"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        other_app = Application.objects.create(
            name='Other App',
            user=other_user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://other.com/callback'
        )

        url = reverse('delete_oauth2_application', kwargs={'application_id': other_app.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Application.objects.filter(id=other_app.id).exists())


class RegenerateClientSecretApiTest(TestCase):
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

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )
        self.old_secret = self.application.client_secret

    def test_regenerate_client_secret_success(self):
        """Test regenerating client secret"""
        url = reverse('regenerate_client_secret', kwargs={'application_id': self.application.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('client_secret', response.data)
        self.assertNotEqual(response.data['client_secret'], self.old_secret)

        # Verify secret was updated in database
        self.application.refresh_from_db()
        self.assertNotEqual(self.application.client_secret, self.old_secret)
        self.assertEqual(self.application.client_secret, response.data['client_secret'])

    def test_regenerate_client_secret_not_found(self):
        """Test regenerating secret for non-existent application"""
        url = reverse('regenerate_client_secret', kwargs={'application_id': 99999})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_regenerate_client_secret_other_user(self):
        """Test regenerating secret for application belonging to another user"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        other_app = Application.objects.create(
            name='Other App',
            user=other_user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://other.com/callback'
        )

        url = reverse('regenerate_client_secret', kwargs={'application_id': other_app.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

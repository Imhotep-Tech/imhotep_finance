from django.test import TestCase
from django.contrib.auth import get_user_model
from oauth2_provider.models import Application
from developer_portal.services import (
    create_oauth2_application,
    get_user_applications,
    get_application_by_id,
    delete_oauth2_application,
    regenerate_client_secret,
)

User = get_user_model()


class CreateOAuth2ApplicationServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_application_success(self):
        """Test creating OAuth2 application via service"""
        application, message = create_oauth2_application(
            user=self.user,
            name='My App',
            redirect_uris='https://myapp.com/callback'
        )

        self.assertIsNotNone(application)
        self.assertEqual(message, 'Application created successfully')
        self.assertEqual(application.name, 'My App')
        self.assertEqual(application.user, self.user)
        self.assertTrue(Application.objects.filter(user=self.user, name='My App').exists())

    def test_create_application_without_user(self):
        """Test creating application without user"""
        application, message = create_oauth2_application(
            user=None,
            name='My App',
            redirect_uris='https://myapp.com/callback'
        )

        self.assertIsNone(application)
        self.assertIn('User must be authenticated', message)

    def test_create_application_without_name(self):
        """Test creating application without name"""
        application, message = create_oauth2_application(
            user=self.user,
            name='',
            redirect_uris='https://myapp.com/callback'
        )

        self.assertIsNone(application)
        self.assertIn('Application name is required', message)

    def test_create_application_custom_client_type(self):
        """Test creating application with custom client type"""
        application, message = create_oauth2_application(
            user=self.user,
            name='Public App',
            client_type='public',
            redirect_uris='https://myapp.com/callback'
        )

        self.assertIsNotNone(application)
        self.assertEqual(application.client_type, 'public')


class GetUserApplicationsServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_get_user_applications(self):
        """Test getting all applications for a user"""
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
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://app2.com/callback'
        )

        applications = get_user_applications(user=self.user)
        self.assertEqual(applications.count(), 2)

    def test_get_user_applications_empty(self):
        """Test getting applications when user has none"""
        applications = get_user_applications(user=self.user)
        self.assertEqual(applications.count(), 0)

    def test_get_user_applications_other_user(self):
        """Test that applications from other users are not returned"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        Application.objects.create(
            name='Other App',
            user=other_user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://other.com/callback'
        )

        applications = get_user_applications(user=self.user)
        self.assertEqual(applications.count(), 0)


class GetApplicationByIdServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )

    def test_get_application_by_id_success(self):
        """Test getting application by ID"""
        app = get_application_by_id(user=self.user, application_id=self.application.id)
        self.assertIsNotNone(app)
        self.assertEqual(app.id, self.application.id)

    def test_get_application_by_id_not_found(self):
        """Test getting non-existent application"""
        app = get_application_by_id(user=self.user, application_id=99999)
        self.assertIsNone(app)

    def test_get_application_by_id_other_user(self):
        """Test that applications from other users are not returned"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        app = get_application_by_id(user=other_user, application_id=self.application.id)
        self.assertIsNone(app)


class DeleteOAuth2ApplicationServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )

    def test_delete_application_success(self):
        """Test deleting application via service"""
        success, message = delete_oauth2_application(
            user=self.user,
            application_id=self.application.id
        )

        self.assertTrue(success)
        self.assertIn('deleted successfully', message)
        self.assertFalse(Application.objects.filter(id=self.application.id).exists())

    def test_delete_application_not_found(self):
        """Test deleting non-existent application"""
        success, message = delete_oauth2_application(
            user=self.user,
            application_id=99999
        )

        self.assertFalse(success)
        self.assertIn('not found', message.lower())

    def test_delete_application_other_user(self):
        """Test that users cannot delete other users' applications"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        success, message = delete_oauth2_application(
            user=other_user,
            application_id=self.application.id
        )

        self.assertFalse(success)
        self.assertTrue(Application.objects.filter(id=self.application.id).exists())


class RegenerateClientSecretServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.application = Application.objects.create(
            name='My App',
            user=self.user,
            client_type='confidential',
            authorization_grant_type='authorization-code',
            redirect_uris='https://myapp.com/callback'
        )
        self.old_secret = self.application.client_secret

    def test_regenerate_client_secret_success(self):
        """Test regenerating client secret via service"""
        application, message = regenerate_client_secret(
            user=self.user,
            application_id=self.application.id
        )

        self.assertIsNotNone(application)
        self.assertIn('regenerated successfully', message)
        self.assertNotEqual(application.client_secret, self.old_secret)

        # Verify in database
        self.application.refresh_from_db()
        self.assertNotEqual(self.application.client_secret, self.old_secret)

    def test_regenerate_client_secret_not_found(self):
        """Test regenerating secret for non-existent application"""
        application, message = regenerate_client_secret(
            user=self.user,
            application_id=99999
        )

        self.assertIsNone(application)
        self.assertIn('not found', message.lower())

    def test_regenerate_client_secret_other_user(self):
        """Test that users cannot regenerate secrets for other users' applications"""
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )

        application, message = regenerate_client_secret(
            user=other_user,
            application_id=self.application.id
        )

        self.assertIsNone(application)
        # Verify secret was not changed
        self.application.refresh_from_db()
        self.assertEqual(self.application.client_secret, self.old_secret)

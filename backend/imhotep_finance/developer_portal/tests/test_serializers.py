from django.test import TestCase
from rest_framework.exceptions import ValidationError
from developer_portal.serializers import OAuth2ApplicationCreateSerializer


class OAuth2ApplicationCreateSerializerTest(TestCase):
    def test_valid_data(self):
        """Test serializer with valid data"""
        data = {
            'name': 'My App',
            'client_type': 'confidential',
            'authorization_grant_type': 'authorization-code',
            'redirect_uris': 'https://myapp.com/callback',
            'skip_authorization': False
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_missing_required_fields(self):
        """Test serializer with missing required fields"""
        data = {
            'name': 'My App'
            # Missing redirect_uris
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('redirect_uris', serializer.errors)

    def test_invalid_redirect_uri(self):
        """Test serializer with invalid redirect URI"""
        data = {
            'name': 'My App',
            'redirect_uris': 'invalid-uri'
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('redirect_uris', serializer.errors)

    def test_empty_redirect_uri(self):
        """Test serializer with empty redirect URI"""
        data = {
            'name': 'My App',
            'redirect_uris': ''
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('redirect_uris', serializer.errors)

    def test_multiple_redirect_uris(self):
        """Test serializer with multiple redirect URIs"""
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback\nhttps://myapp.com/callback2'
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        # Should normalize to newline-separated
        self.assertIn('\n', serializer.validated_data['redirect_uris'])

    def test_default_values(self):
        """Test serializer with default values"""
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback'
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['client_type'], 'confidential')
        self.assertEqual(serializer.validated_data['authorization_grant_type'], 'authorization-code')
        self.assertEqual(serializer.validated_data['skip_authorization'], False)

    def test_invalid_client_type(self):
        """Test serializer with invalid client type"""
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback',
            'client_type': 'invalid'
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('client_type', serializer.errors)

    def test_invalid_grant_type(self):
        """Test serializer with invalid grant type"""
        data = {
            'name': 'My App',
            'redirect_uris': 'https://myapp.com/callback',
            'authorization_grant_type': 'invalid'
        }

        serializer = OAuth2ApplicationCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('authorization_grant_type', serializer.errors)

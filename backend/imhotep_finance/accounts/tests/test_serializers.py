from django.test import TestCase
from accounts.serializers import (
    LoginRequestSerializer,
    RegisterRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordRequestSerializer,
    UpdateProfileRequestSerializer
)


class LoginRequestSerializerTests(TestCase):
    def test_valid_data(self):
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        serializer = LoginRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_missing_password(self):
        data = {'username': 'testuser'}
        serializer = LoginRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class RegisterRequestSerializerTests(TestCase):
    def test_valid_data(self):
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'password2': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        serializer = RegisterRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_missing_required_fields(self):
        data = {'username': 'newuser'}
        serializer = RegisterRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class PasswordResetConfirmSerializerTests(TestCase):
    def test_valid_data(self):
        data = {
            'uid': 'test_uid',
            'token': 'test_token',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_password_mismatch(self):
        data = {
            'uid': 'test_uid',
            'token': 'test_token',
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass123!'
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class ChangePasswordRequestSerializerTests(TestCase):
    def test_valid_data(self):
        data = {
            'current_password': 'oldpass123',
            'new_password': 'NewPass123!',
            'confirm_password': 'NewPass123!'
        }
        serializer = ChangePasswordRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_password_mismatch(self):
        data = {
            'current_password': 'oldpass123',
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass123!'
        }
        serializer = ChangePasswordRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class UpdateProfileRequestSerializerTests(TestCase):
    def test_valid_partial_update(self):
        data = {'first_name': 'UpdatedName'}
        serializer = UpdateProfileRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_all_fields_optional(self):
        data = {}
        serializer = UpdateProfileRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_valid_email(self):
        data = {'email': 'newemail@example.com'}
        serializer = UpdateProfileRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

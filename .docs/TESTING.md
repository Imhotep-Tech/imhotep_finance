# 🧪 Testing Guide

Complete guide to testing Imhotep Finance, including backend tests, frontend tests, and integration testing.

## Backend Testing

The Imhotep Finance backend uses Django's built-in testing framework (`django.test` and `unittest`). All tests are organized in a structured `tests/` package within each Django app.

### Test Structure

Each Django app follows a consistent testing structure:

```
app_name/
├── tests/
│   ├── __init__.py
│   ├── test_apis.py       # API endpoint tests
│   ├── test_serializers.py  # Serializer validation tests
│   └── test_services.py   # Business logic tests
```

### Test Categories

**`test_apis.py`** - API Endpoint Tests
- Happy path: Successful requests (200/201 status codes)
- Validation: Invalid data returns 400 Bad Request
- Security: Unauthenticated users receive 401, unauthorized users receive 403
- Authorization: Users can only access their own resources
- Edge cases: Not found (404), invalid data, boundary conditions

**`test_serializers.py`** - Serializer Tests
- Happy path: Valid data passes validation
- Validation: Invalid data returns validation errors
- Field validation: Required fields, format validation, custom validators
- Data transformation: Serialization and deserialization

**`test_services.py`** - Business Logic Tests
- Service function correctness
- Data manipulation and calculations
- Error handling in business logic
- Integration between services

### Running Tests

**Run all tests:**
```bash
# Using Docker
docker exec imhotep_finance-backend-1 python manage.py test

# Without Docker
cd backend/imhotep_finance
python manage.py test
```

**Run tests for a specific app:**
```bash
# Accounts app
python manage.py test accounts

# Transaction management
python manage.py test transaction_management

# Developer portal
python manage.py test developer_portal

# Public API
python manage.py test public_api
```

**Run a specific test file:**
```bash
# API tests
python manage.py test accounts.tests.test_apis
python manage.py test transaction_management.tests.test_apis

# Serializer tests
python manage.py test accounts.tests.test_serializers

# Service tests
python manage.py test transaction_management.tests.test_services
```

**Run a specific test class:**
```bash
python manage.py test accounts.tests.test_apis.UserLoginApiTest
```

**Run a specific test method:**
```bash
python manage.py test accounts.tests.test_apis.UserLoginApiTest.test_login_success
```

**Run tests with verbosity:**
```bash
# Verbose output (shows each test as it runs)
python manage.py test accounts --verbosity=2

# Very verbose (shows all output including print statements)
python manage.py test accounts --verbosity=3
```

**Run tests and keep the test database:**
```bash
# Useful for debugging - keeps the test database after tests complete
python manage.py test accounts --keepdb
```

**Run tests in parallel (faster):**
```bash
# Run tests in parallel using multiple processes
python manage.py test accounts --parallel
```

### Test Database

- Tests automatically use an isolated test database (SQLite in-memory by default)
- The test database is created before tests run and destroyed after
- Each test runs in a transaction that's rolled back, ensuring no data leaks between tests
- Configured in `imhotep_finance/settings_test.py`

### Test Coverage by App

**Accounts App:**
- User registration and authentication
- Profile management
- Google OAuth integration
- Email verification
- Password reset

**Transaction Management:**
- Transaction CRUD operations
- Transaction filtering and pagination
- CSV import functionality
- Transaction validation

**Developer Portal:**
- OAuth2 application creation
- Application management
- Client secret regeneration
- Swagger redirect URI management

**Public API:**
- OAuth2 authentication
- Scope validation
- Transaction creation (external)
- Transaction listing (external)
- Transaction deletion (external)
- User data isolation

### Writing New Tests

**API Test Example:**
```python
from rest_framework.test import APITestCase
from rest_framework import status

class MyApiTest(APITestCase):
    def test_endpoint_success(self):
        """Test successful API request."""
        response = self.client.get('/api/endpoint/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

**Serializer Test Example:**
```python
from rest_framework.test import APITestCase
from myapp.serializers import MySerializer

class MySerializerTest(APITestCase):
    def test_serializer_validation(self):
        """Test serializer with valid data."""
        data = {'field': 'value'}
        serializer = MySerializer(data=data)
        self.assertTrue(serializer.is_valid())
```

**Service Test Example:**
```python
from django.test import TestCase
from myapp.services import my_service_function

class MyServiceTest(TestCase):
    def test_service_function(self):
        """Test service function."""
        result = my_service_function(param='value')
        self.assertIsNotNone(result)
```

### Test Best Practices

1. **Use descriptive test names**: `test_user_creation_success` is better than `test_user`
2. **Test one thing per test**: Each test should verify a single behavior
3. **Test edge cases**: Invalid data, missing fields, boundary conditions
4. **Test security**: Always test unauthenticated access and authorization
5. **Keep tests isolated**: Don't rely on test execution order
6. **Use meaningful assertions**: Include error messages in assertions

### Common Test Patterns

**Testing Authentication:**
```python
def test_endpoint_requires_authentication(self):
    """Test that endpoint requires authentication."""
    self.client.credentials()  # Clear credentials
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

**Testing Validation Errors:**
```python
def test_validation_invalid_data(self):
    """Test that invalid data returns 400."""
    data = {'invalid_field': 'invalid_value'}
    response = self.client.post('/api/endpoint/', data, format='json')
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('error', response.data)
```

**Testing User Isolation:**
```python
def test_user_can_only_access_own_resources(self):
    """Test that users can only access their own resources."""
    user1 = self.create_user(username='user1')
    user2 = self.create_user(username='user2')
    self.client.force_authenticate(user=user1)
    
    resource = self.create_resource(owner=user2)
    response = self.client.get(f'/api/resource/{resource.id}/')
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
```

## Frontend Testing

### Running Frontend Tests

```bash
cd frontend/imhotep_finance
npm test
```

### Frontend Test Structure

Frontend tests are located alongside components and use React Testing Library:

```
src/
├── components/
│   └── Component.test.jsx
├── pages/
│   └── Page.test.jsx
└── utils/
    └── util.test.js
```

## Integration Testing

### OAuth2 Flow Testing

Test the complete OAuth2 flow using the provided test scripts:

```bash
# Complete OAuth2 flow test
./test_oauth2_flow.sh

# External app integration simulation
./test_external_app_integration.sh
```

### Manual Integration Testing

1. **Start the application**: `docker compose up`
2. **Test user registration**: Create a new account
3. **Test authentication**: Log in and verify JWT token
4. **Test API endpoints**: Use Swagger UI to test endpoints
5. **Test OAuth2 flow**: Use Developer Portal to create an app and test OAuth2

## Test Statistics

**Total Test Count:**
- Accounts App: ~50+ tests
- Transaction Management: ~40+ tests
- Developer Portal: ~30+ tests
- Public API: ~20+ tests
- Other apps: ~100+ tests
- **Total: ~240+ tests** covering models, views, serializers, and services

**Test Categories:**
- Happy Path Tests: ~40% (successful operations)
- Validation Tests: ~30% (invalid data handling)
- Security Tests: ~20% (authentication, authorization)
- Edge Case Tests: ~10% (boundary conditions, error handling)

## Troubleshooting Tests

### Tests Failing with Database Errors

- Make sure migrations are up to date: `python manage.py migrate`
- Check that test database can be created (permissions, disk space)
- Verify `settings_test.py` is properly configured

### Tests Failing with Authentication Errors

- Ensure you're setting authentication in tests
- Check that JWT tokens are being set correctly
- Verify user creation in test setup

### Tests Failing with Timezone Warnings

- Use `timezone.now()` for datetime objects
- Ensure timezone-aware datetimes in tests
- Check Django timezone settings

### Tests Running Slowly

- Use `--parallel` flag to run tests in parallel
- Use `--keepdb` to reuse test database (faster but less isolated)
- Run only specific test files during development

## Continuous Integration

GitHub Actions runs the test suite automatically on:
- Every pull request
- Pushes to main branch
- Scheduled runs (if configured)

See `.github/workflows/` for CI configuration.

## Additional Resources

- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Development practices
- [Folder Structure](FOLDER_STRUCTURE.md) - Project organization
- [API Documentation](API_DOCUMENTATION.md) - API testing in Swagger

---

**Test Command Quick Reference:**

```bash
# Run all tests
python manage.py test

# Run specific app
python manage.py test accounts

# Run with options
python manage.py test accounts --verbosity=2
python manage.py test accounts --keepdb
python manage.py test accounts --parallel

# Run specific test
python manage.py test accounts.tests.test_apis.UserLoginApiTest.test_login_success
```

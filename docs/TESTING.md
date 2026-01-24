# 🧪 Testing

## Backend Testing

The TAConnect backend uses Django's built-in testing framework (`django.test` and `unittest`) with no external dependencies like `pytest` or `factory_boy`. All tests are organized in a structured `tests/` package within each Django app.

### Test Structure

Each Django app (`accounts`, `instructor`, `student`) follows the same testing structure:

```
app_name/
├── tests/
│   ├── __init__.py          # Package initialization
│   ├── base.py              # Base test class with common setup methods
│   ├── test_models.py       # Model tests (creation, validation, relationships)
│   ├── test_views.py        # API endpoint tests (happy path, validation, security)
│   └── test_forms.py        # Serializer tests (validation, data transformation)
```

### Test Files Overview

**`base.py`** - Base Test Class
- Provides common setup methods for all tests
- Inherits from `APITestCase` for API testing
- Handles user creation (instructors, students)
- Manages authentication with JWT tokens
- Creates test data (office hour slots, bookings, etc.)
- Automatically disables throttling during tests
- Each test runs in an isolated transaction that's rolled back

**Base Test Class Helper Methods:**

*Accounts App (`accounts/tests/base.py`):*
- `create_user()` - Creates a user with optional profile (instructor/student)
- `create_instructor()` - Creates an instructor user with InstructorProfile
- `create_student()` - Creates a student user with StudentProfile
- `authenticate_user(user)` - Authenticates a user and sets JWT token in client
- `create_and_authenticate_user()` - Creates and authenticates in one call

*Instructor App (`instructor/tests/base.py`):*
- `create_instructor()` - Creates an instructor user
- `create_student()` - Creates a student user
- `create_office_hour_slot()` - Creates OfficeHourSlot with BookingPolicy
- `authenticate_user(user)` - Authenticates a user
- `create_and_authenticate_instructor()` - Creates and authenticates instructor
- `create_and_authenticate_student()` - Creates and authenticates student

*Student App (`student/tests/base.py`):*
- `create_instructor()` - Creates an instructor user
- `create_student()` - Creates a student user
- `create_office_hour_slot()` - Creates OfficeHourSlot with BookingPolicy
- `create_booking()` - Creates a Booking with proper relationships and timezone-aware datetimes
- `authenticate_user(user)` - Authenticates a user
- `create_and_authenticate_student()` - Creates and authenticates student
- `create_and_authenticate_instructor()` - Creates and authenticates instructor

**`test_models.py`** - Model Tests
- **Happy Path**: Successful creation and retrieval of model instances
- **Validation**: Field validation, unique constraints, choice fields
- **Relationships**: Foreign keys, one-to-one, cascade deletes
- **Business Logic**: Custom methods, property calculations
- **String Representations**: `__str__` method tests

**`test_views.py`** - API Endpoint Tests
- **Happy Path**: Successful requests (200/201 status codes)
- **Validation**: Invalid data returns 400 Bad Request
- **Security**: Unauthenticated users receive 401, wrong user types receive 403
- **Authorization**: Users can only access their own resources
- **Edge Cases**: Not found (404), past dates, inactive slots, etc.

**`test_forms.py`** - Serializer Tests
- **Happy Path**: Valid data passes validation and creates/updates records
- **Validation**: Invalid data returns validation errors
- **Field Validation**: Required fields, format validation, custom validators
- **Data Transformation**: Serialization and deserialization
- **Context Validation**: Business logic validation (date ranges, time overlaps, etc.)

### Running Tests

**Run all tests:**
```bash
# Using Docker
docker exec taconnect-backend-1 python manage.py test

# Without Docker
python manage.py test
```

**Run tests for a specific app:**
```bash
# Accounts app
docker exec taconnect-backend-1 python manage.py test accounts
python manage.py test accounts

# Instructor app
docker exec taconnect-backend-1 python manage.py test instructor
python manage.py test instructor

# Student app
docker exec taconnect-backend-1 python manage.py test student
python manage.py test student
```

**Run a specific test file:**
```bash
# Models tests
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_models
docker exec taconnect-backend-1 python manage.py test instructor.tests.test_models
docker exec taconnect-backend-1 python manage.py test student.tests.test_models

# Views tests
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_views
docker exec taconnect-backend-1 python manage.py test instructor.tests.test_views
docker exec taconnect-backend-1 python manage.py test student.tests.test_views

# Serializer tests
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_forms
docker exec taconnect-backend-1 python manage.py test instructor.tests.test_forms
docker exec taconnect-backend-1 python manage.py test student.tests.test_forms
```

**Run a specific test class:**
```bash
# Example: User model tests
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_models.UserModelTestCase

# Example: Booking model tests
docker exec taconnect-backend-1 python manage.py test student.tests.test_models.BookingModelTestCase

# Example: Register view tests
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_views.RegisterViewTestCase
```

**Run a specific test method:**
```bash
# Example: Test user creation
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_models.UserModelTestCase.test_user_creation_happy_path

# Example: Test booking creation
docker exec taconnect-backend-1 python manage.py test student.tests.test_views.BookingCreateViewTestCase.test_create_booking_happy_path
```

**Run tests with verbosity:**
```bash
# Verbose output (shows each test as it runs)
docker exec taconnect-backend-1 python manage.py test accounts --verbosity=2

# Very verbose (shows all output including print statements)
docker exec taconnect-backend-1 python manage.py test accounts --verbosity=3
```

**Run tests and keep the test database:**
```bash
# Useful for debugging - keeps the test database after tests complete
docker exec taconnect-backend-1 python manage.py test accounts --keepdb
```

**Run tests in parallel (faster):**
```bash
# Run tests in parallel using multiple processes
docker exec taconnect-backend-1 python manage.py test accounts --parallel
```

**Run tests with specific pattern:**
```bash
# Run all tests matching a pattern
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_views --pattern="*happy*"
```

### Test Database

- Tests automatically use an isolated test database (SQLite in-memory by default)
- The test database is created before tests run and destroyed after
- Each test runs in a transaction that's rolled back, ensuring no data leaks between tests
- Configured in `ta_connect/settings_test.py`

### Test Coverage by App

**Accounts App Tests:**
- `UserModelTestCase`: User creation, validation, user types, profiles
- `InstructorProfileModelTestCase`: Profile creation, one-to-one relationships
- `StudentProfileModelTestCase`: Profile creation, one-to-one relationships
- `GoogleCalendarCredentialsModelTestCase`: Credentials creation, validation, expiration checks, enable/disable
- `RegisterViewTestCase`: Registration endpoint (happy path, validation, security)
- `LoginViewTestCase`: Login endpoint (username/email, unverified email)
- `UserViewTestCase`: User data retrieval (authenticated/unauthenticated)
- `VerifyEmailViewTestCase`: Email verification (valid/invalid tokens)
- `GoogleCalendarConnectUrlViewTestCase`: Get OAuth URL (happy path, authentication, throttling)
- `GoogleCalendarConnectViewTestCase`: Connect Google Calendar (happy path, invalid code, token exchange errors)
- `GoogleCalendarStatusViewTestCase`: Get connection status (connected, not connected, enabled/disabled)
- `GoogleCalendarToggleViewTestCase`: Enable/disable calendar (happy path, not connected, validation)
- `GoogleCalendarDisconnectViewTestCase`: Disconnect calendar (happy path, not connected)
- `GoogleCalendarCallbackViewTestCase`: OAuth callback handling (code, error, redirect)
- `RegisterSerializerTestCase`: Registration serializer validation
- `LoginSerializerTestCase`: Login serializer validation

**Instructor App Tests:**
- `OfficeHourSlotModelTestCase`: Slot creation, day of week, time availability
- `BookingPolicyModelTestCase`: Policy creation, one-to-one relationships
- `AllowedStudentsModelTestCase`: Allowed students, unique constraints
- `GetUserSlotsViewTestCase`: Retrieve instructor slots (own slots only)
- `TimeSlotCreateViewTestCase`: Create time slots (validation, security)
- `SearchInstructorsViewTestCase`: Search instructors (with/without query)
- `InstructorDataViewTestCase`: Get instructor details (found/not found)
- `TimeSlotSerializerTestCase`: Time slot serializer (create, update, validation)

**Student App Tests:**
- `BookingModelTestCase`: Booking creation, end time calculation, relationships, book_description field
- `BookingCreateViewTestCase`: Create bookings, get bookings list (date ranges)
- `BookingDetailViewTestCase`: Update bookings, cancel bookings, get available times
- `CreateBookingSerializerTestCase`: Booking creation validation (date ranges, overlaps, book_description)
- `UpdateBookingSerializerTestCase`: Booking update validation
- `CancelBookingSerializerTestCase`: Booking cancellation validation (past bookings)
- `ConfirmBookingSerializerTestCase`: Booking confirmation validation

### Google Calendar Integration Tests

The Google Calendar integration includes comprehensive tests covering:

**Model Tests (`GoogleCalendarCredentialsModelTestCase`):**
- Credentials creation (happy path, one-to-one relationship)
- Token expiration checks (`is_expired()` method)
- Valid credentials check (`has_valid_credentials()` method)
- Calendar enabled/disabled state
- Cascade delete when user is deleted
- String representation

**View Tests:**
- `GoogleCalendarConnectUrlViewTestCase`: OAuth URL generation, authentication required, throttling
- `GoogleCalendarConnectViewTestCase`: Successful connection, invalid code, token exchange failures, network errors
- `GoogleCalendarStatusViewTestCase`: Status retrieval (connected/not connected, enabled/disabled)
- `GoogleCalendarToggleViewTestCase`: Enable/disable functionality, validation (not connected, invalid data)
- `GoogleCalendarDisconnectViewTestCase`: Successful disconnect, not connected error handling
- `GoogleCalendarCallbackViewTestCase`: OAuth callback redirects (success, error, missing code)

**Edge Cases Covered:**
- Missing or invalid authorization codes
- Expired tokens
- Network failures during token exchange
- Users without credentials
- Disabled calendar integration
- Unauthenticated access attempts
- Rate limiting (throttling)
- Invalid redirect URIs
- Missing state parameters

### Writing New Tests

When adding new tests, follow these patterns:

**Model Test Example:**
```python
def test_model_creation_happy_path(self):
    """Test successful model creation."""
    instance = Model.objects.create(field='value')
    self.assertIsNotNone(instance.id)
    self.assertEqual(instance.field, 'value')
```

**View Test Example:**
```python
def test_endpoint_happy_path(self):
    """Test successful API request."""
    user, token = self.create_and_authenticate_user()
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_200_OK)
```

**Serializer Test Example:**
```python
def test_serializer_validation_happy_path(self):
    """Test serializer with valid data."""
    serializer = MySerializer(data={'field': 'value'})
    self.assertTrue(serializer.is_valid())
```

### Test Best Practices

1. **Use descriptive test names**: `test_user_creation_happy_path` is better than `test_user`
2. **Test one thing per test**: Each test should verify a single behavior
3. **Use the base class**: Inherit from `BaseTestCase` to get helper methods
4. **Test edge cases**: Invalid data, missing fields, boundary conditions
5. **Test security**: Always test unauthenticated access and wrong user types
6. **Keep tests isolated**: Don't rely on test execution order
7. **Use meaningful assertions**: Include error messages in assertions

### Common Test Patterns

**Testing Authentication:**
```python
def test_endpoint_requires_authentication(self):
    """Test that endpoint requires authentication."""
    self.client.credentials()  # Clear credentials
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

**Testing User Type Permissions:**
```python
def test_endpoint_requires_instructor(self):
    """Test that only instructors can access endpoint."""
    student, token = self.create_and_authenticate_student()
    response = self.client.get('/api/instructor/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

**Testing Validation Errors:**
```python
def test_validation_invalid_data(self):
    """Test that invalid data returns 400."""
    user, token = self.create_and_authenticate_user()
    data = {'invalid_field': 'invalid_value'}
    response = self.client.post('/api/endpoint/', data, format='json')
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('error', response.data)
```

**Testing Own Resources Only:**
```python
def test_user_can_only_access_own_resources(self):
    """Test that users can only access their own resources."""
    user1, token1 = self.create_and_authenticate_user(username='user1')
    user2 = self.create_user(username='user2')
    resource = self.create_resource(owner=user2)
    
    response = self.client.get(f'/api/resource/{resource.id}/')
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
```

### Troubleshooting Tests

**Tests failing with database errors:**
- Make sure migrations are up to date: `python manage.py migrate`
- Check that test database can be created (permissions, disk space)
- Verify `settings_test.py` is properly configured

**Tests failing with authentication errors:**
- Ensure you're using the base test class helper methods
- Check that JWT tokens are being set correctly
- Verify `authenticate_user()` or `create_and_authenticate_*()` is called

**Tests failing with timezone warnings:**
- Use `timezone.make_aware()` for datetime objects
- The base test class handles this automatically in helper methods
- Student app's `create_booking()` automatically makes datetimes timezone-aware

**Tests failing with 429 (Too Many Requests):**
- Throttling is automatically disabled in base test class
- If you see 429 errors, check that you're inheriting from `BaseTestCase`

**Tests running slowly:**
- Use `--parallel` flag to run tests in parallel
- Use `--keepdb` to reuse test database (faster but less isolated)
- Run only specific test files during development

**Tests failing with import errors:**
- Ensure `format_serializer_errors` is imported in views (already fixed in all apps)
- Check that all required imports are present

**Tests failing with unique constraint errors:**
- Use unique usernames/emails when creating multiple users
- The base test class uses UUID to generate unique usernames when needed
- Pass explicit unique values when creating test data

### Test Statistics

**Total Test Count:**
- Accounts App: ~80 tests (including Google Calendar tests)
- Instructor App: ~42 tests
- Student App: ~36 tests
- **Total: ~158 tests** covering models, views, and serializers

**Test Categories:**
- Happy Path Tests: ~40% (successful operations)
- Validation Tests: ~30% (invalid data handling)
- Security Tests: ~20% (authentication, authorization)
- Edge Case Tests: ~10% (boundary conditions, error handling)

### Frontend Testing

```bash
npm test
```

### Test Command Quick Reference

```bash
# Run all tests
docker exec taconnect-backend-1 python manage.py test

# Run specific app
docker exec taconnect-backend-1 python manage.py test accounts
docker exec taconnect-backend-1 python manage.py test instructor
docker exec taconnect-backend-1 python manage.py test student

# Run with options
docker exec taconnect-backend-1 python manage.py test accounts --verbosity=2
docker exec taconnect-backend-1 python manage.py test accounts --keepdb
docker exec taconnect-backend-1 python manage.py test accounts --parallel

# Run specific test
docker exec taconnect-backend-1 python manage.py test accounts.tests.test_models.UserModelTestCase.test_user_creation_happy_path
```


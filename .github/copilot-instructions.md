# Copilot Instructions for Imhotep Finance

This file contains essential information to help AI assistants work effectively in this repository.

## Project Overview

**Imhotep Finance** is a full-stack personal finance management platform with:
- **Backend**: Django 5.2 + Django REST Framework with multiple feature apps
- **Frontend**: React 19 + Vite + Tailwind CSS (web) + React Native + Expo (mobile)
- **Database**: PostgreSQL
- **Auth**: JWT + Google OAuth
- **API Docs**: Swagger/OpenAPI via `drf-spectacular`

The architecture separates concerns into feature-based Django apps (accounts, transaction_management, finance_management, scheduled_trans_management, target_management, user_reports, wishlist_management).

## Build & Development

### Starting the Full Stack

```bash
# Build and start all services (backend, frontend, PostgreSQL)
docker compose up --build

# Access points:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8010
# - Swagger UI: http://localhost:8010/swagger/
# - Django Admin: http://localhost:8010/admin/
```

### Frontend Development

```bash
cd frontend/imhotep_finance

# Dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
cd backend/imhotep_finance

# Run development server (local)
python manage.py runserver 8010

# Apply database migrations
python manage.py migrate

# Create superuser for Django Admin
python manage.py createsuperuser
```

### Mobile App Development

```bash
cd frontend/imhotep_finance_mobile

# Start Expo development server
npx expo start

# Options after startup:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR with Expo Go app for real device testing
```

## Testing

### Backend Tests (Django)

```bash
# Run all tests
python manage.py test

# Run specific app (e.g., accounts, transaction_management)
python manage.py test accounts

# Run specific test file
python manage.py test accounts.tests.test_apis

# Run specific test class
python manage.py test accounts.tests.test_apis.UserLoginApiTest

# Run specific test method
python manage.py test accounts.tests.test_apis.UserLoginApiTest.test_login_success

# With Docker
docker exec imhotep_finance-backend-1 python manage.py test accounts --verbosity=2

# Useful flags:
# --verbosity=2 : Show each test as it runs
# --keepdb : Keep test database for debugging
# --parallel : Run tests in parallel (faster)
```

Test structure in each app:
```
app_name/
├── tests/
│   ├── test_apis.py       # API endpoint tests
│   ├── test_serializers.py  # Serializer validation tests
│   └── test_services.py   # Business logic tests
```

Test coverage: ~240 tests across all apps, covering happy path, validation, security, and edge cases.

### Frontend Tests

```bash
cd frontend/imhotep_finance
npm test
```

## Project Structure

### Backend Apps

- **`accounts/`**: User authentication, profiles, Google OAuth integration
- **`finance_management/`**: Core finance models (NetWorth, Categories), currency utilities
- **`transaction_management/`**: Transaction CRUD, CSV import, filtering
- **`scheduled_trans_management/`**: Recurring transaction automation
- **`target_management/`**: Savings goals and targets
- **`user_reports/`**: Financial reports and analytics generation
- **`wishlist_management/`**: Wishlist items and tracking

### Frontend

**Web** (`frontend/imhotep_finance/src/`):
- `components/` - Reusable React components (common, PWA)
- `pages/` - Page-level components (auth, main, profile)
- `contexts/` - React Context providers (AuthContext, ThemeContext)
- `hooks/` - Custom React hooks
- `config/` - API client setup (`config/api.js`)
- `utils/` - Utility functions

**Mobile** (`frontend/imhotep_finance_mobile/`):
- `app/` - File-based routing with Expo Router
  - `(auth)/` - Authentication screens
  - `(tabs)/` - Main app tabs (dashboard, transactions, reports, etc.)
- `components/` - Reusable React Native components
- `constants/` - API configuration, colors, types
- `contexts/` - State management (AuthContext)
- `hooks/` - Custom hooks for theme, layout
- `widgets/` - Android home-screen widgets

## Key Conventions

### Backend (Django)

1. **Architecture Pattern**: Each app is feature-based with:
   - `models.py` - Data models
   - `apis.py` - API views/viewsets (DRF)
   - `serializers.py` - Request/response serialization
   - `services.py` - Business logic (not views)
   - `selectors.py` - Query optimization (select_related, prefetch_related)
   - `tests/` - Test suite (test_apis, test_serializers, test_services)

2. **Authentication**: JWT via `rest_framework_simplejwt`
   - Access tokens: 60 minutes
   - Refresh tokens: 30 days
   - Token blacklist on rotation enabled

3. **API Documentation**: Swagger/OpenAPI via `drf-spectacular`
   - Auto-generated at `/swagger/`
   - Use docstrings on viewsets/serializers for documentation

4. **Security**:
   - All endpoints require authentication (default permission: `IsAuthenticated`)
   - User isolation: Users can only access their own resources
   - Rate limiting via throttle classes (1000 req/hr for users, 100 for anonymous)
   - Sensitive fields encrypted via `django-encrypted-model-fields`

5. **Testing Requirements**:
   - Happy path (200/201 success)
   - Validation errors (400 Bad Request)
   - Security (401 Unauthorized, 403 Forbidden)
   - Authorization (user isolation)
   - Edge cases (404, boundaries)

6. **Database**: PostgreSQL configured in `.env` via `psycopg[binary]`

### Frontend (React/Vite)

1. **Styling**: Tailwind CSS (configured in `tailwind.config.js`)

2. **Component Structure**: Functional components with hooks
   - State: React hooks (useState, useContext)
   - Context: AuthContext for global auth state, ThemeContext for theme
   - API calls: Axios with JWT in Authorization header

3. **Routing**: React Router v7 (web), Expo Router (mobile)

4. **API Integration**:
   - Web: Configured in `frontend/imhotep_finance/src/config/api.js`
   - Mobile: Configured in `frontend/imhotep_finance_mobile/constants/api.ts`
   - JWT stored in localStorage (web) or AsyncStorage (mobile)

## Environment Setup

### Backend (.env)

Key variables (from `.env.example`):
- `SECRET_KEY` - Django secret key
- `DEBUG` - Set to False in production
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` - Database credentials
- `FIELD_ENCRYPTION_KEY` - Encryption key for sensitive fields (generate with: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth credentials
- `frontend_url` - Frontend URL for CORS

### Frontend (.env)

Key variables:
- `VITE_API_URL` - Backend API URL (e.g., `http://localhost:8010`)

## Common Tasks

### Adding a New API Endpoint

1. Define model in `{app}/models.py`
2. Create serializer in `{app}/serializers.py` (with validation)
3. Create viewset in `{app}/apis.py` (inherit from `ModelViewSet` or appropriate class)
4. Add URL in `{app}/urls.py`
5. Write tests in `{app}/tests/test_apis.py`
6. Business logic in `{app}/services.py` (keep views thin)

### Adding a New Feature App

1. Run `python manage.py startapp {app_name}`
2. Add to `INSTALLED_APPS` in settings
3. Create URL routing in app's `urls.py`
4. Add include in main `imhotep_finance/urls.py`
5. Create test structure
6. Document in Swagger (via docstrings)

### Running Database Migrations

```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

### Docker Development Notes

- Backend container mounts source at `/app` with hot-reload enabled
- Frontend container mounts source at `/app` with HMR (Hot Module Replacement)
- Node modules volume prevents node_modules from being overwritten
- PostgreSQL health check ensures DB is ready before backend starts

## Commit Message Format

From `CONTRIBUTING.md`:
- `Add:` - New feature
- `Fix:` - Bug fix
- `Update:` - Update existing feature
- `Refactor:` - Code refactoring
- `Docs:` - Documentation changes

Example: `Add: transaction filtering by date range`

## Branch Naming Convention

- Backend features: `feature/backend/feature-name`
- Frontend features: `feature/frontend/feature-name`
- Bug fixes: `fix/issue-description`
- Documentation: `docs/documentation-update`

## Documentation

Comprehensive docs in `.docs/`:
- **TESTING.md** - Detailed testing guide with examples
- **DEVELOPMENT_WORKFLOW.md** - Local development practices
- **ENVIRONMENT_VARIABLES.md** - All configuration options
- **FOLDER_STRUCTURE.md** - Complete directory layout
- **API_DOCUMENTATION.md** - API endpoint reference
- **CONTRIBUTING.md** - Contribution guidelines
- **MOBILE_APP.md** - Mobile app setup and testing

## Important Notes

1. **JWT in Frontend**: Always include JWT token in request headers:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

2. **Pagination**: Default page size is 20 (configurable in settings)

3. **CORS**: In development, `CORS_ALLOW_ALL_ORIGINS = True`; in production, set specific origins

4. **Swagger Access**: Available at `/swagger/` when DEBUG=True

5. **Admin Panel**: Django admin at `/admin/` (requires superuser)

6. **Test Database**: Automatically uses SQLite in-memory; configured in `settings_test.py`

7. **Throttling**: Different limits for different operations (login: 5/min, registration: 3/hour, etc.)

8. **Field Encryption**: Sensitive fields use `django-encrypted-model-fields` - always set `FIELD_ENCRYPTION_KEY`

## Useful Commands Quick Reference

```bash
# Backend setup
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8010

# Testing
python manage.py test accounts --verbosity=2

# Docker
docker compose up --build
docker compose down
docker exec imhotep_finance-backend-1 python manage.py migrate

# Frontend
npm install
npm run dev
npm run build
```

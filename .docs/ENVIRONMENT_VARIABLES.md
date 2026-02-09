# ⚙️ Environment Variables

Complete guide to configuring environment variables for Imhotep Finance.

## Backend Environment Variables

Create `backend/imhotep_finance/.env` file with the following variables:

```env
# Database Configuration
# Option A: Single DATABASE_URL
DATABASE_URL=postgres://imhotep_user:imhotep_password@localhost:5432/imhotep_finance_db

# Or Option B: Separate DB vars (used by Docker)
DB_HOST=db
DB_PORT=5432
DB_NAME=imhotep_finance_db
DB_USER=imhotep_user
DB_PASSWORD=imhotep_password

# Django Settings
SECRET_KEY=your-django-secret-key-change-this
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-change-this

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Google OAuth Integration (Optional)
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/

# Field Encryption (Required)
# Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY=your-generated-fernet-key

# Site Configuration
SITE_DOMAIN=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000
```

## Frontend Environment Variables

Create `frontend/imhotep_finance/.env` file with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# App URL (for SEO and social sharing)
VITE_APP_URL=http://localhost:3000

# Google OAuth (if using frontend OAuth flow)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Mobile App Environment Variables

Create `frontend/imhotep_finance_mobile/.env` file (optional):

```env
# Backend API URL (optional - auto-detected if not set)
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
```

> 💡 **Note**: The mobile app automatically selects the API URL:
> - **Development mode** (`__DEV__`): Uses local IP (e.g., `http://10.218.226.170:8000`)
> - **Production mode**: Uses production URL (e.g., `https://imhotepf.pythonanywhere.com`)
> - **Override**: Set `EXPO_PUBLIC_API_URL` in `.env` to override automatic selection

For local development on physical devices, update `constants/api.ts` with your machine's local IP address instead of `localhost`.

## Required Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ Yes | Django secret key for cryptographic signing |
| `DATABASE_URL` or `DB_*` | ✅ Yes | PostgreSQL database connection |
| `FIELD_ENCRYPTION_KEY` | ✅ Yes | Fernet key for encrypting sensitive fields |
| `JWT_SECRET` | ✅ Yes | Secret for JWT token signing |
| `SITE_DOMAIN` | ✅ Yes | Backend domain (used for OAuth2 redirects) |
| `FRONTEND_URL` | ✅ Yes | Frontend domain (for CORS and redirects) |
| `DEBUG` | ⚠️ Recommended | Set to `0` in production |
| `ALLOWED_HOSTS` | ⚠️ Recommended | Comma-separated list of allowed hosts |
| `EMAIL_*` | ❌ Optional | For email notifications |
| `GOOGLE_OAUTH2_*` | ❌ Optional | For Google login integration |

### Frontend (Web)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Backend API URL |
| `VITE_APP_URL` | ⚠️ Recommended | Frontend URL (for SEO) |

### Mobile App

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | ❌ Optional | Backend API URL (auto-detected if not set) |

## Generating Required Keys

### Django Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Field Encryption Key

```bash
pip install django-encrypted-model-fields
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Production Configuration

### Security Checklist

- [ ] Set `DEBUG=0` in production
- [ ] Use strong, unique `SECRET_KEY` and `JWT_SECRET`
- [ ] Set `ALLOWED_HOSTS` to your production domain
- [ ] Use HTTPS URLs for `SITE_DOMAIN` and `FRONTEND_URL`
- [ ] Configure `CORS_ALLOWED_ORIGINS` with production frontend URL
- [ ] Use secure database credentials
- [ ] Store encryption keys securely (never commit to version control)
- [ ] Configure proper email settings for notifications

### Example Production `.env`

```env
# Backend
DEBUG=0
ALLOWED_HOSTS=api.yourdomain.com
SITE_DOMAIN=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database (use secure credentials)
DATABASE_URL=postgres://secure_user:secure_password@db_host:5432/imhotep_finance

# Use environment-specific secrets
SECRET_KEY=production-secret-key
JWT_SECRET=production-jwt-secret
FIELD_ENCRYPTION_KEY=production-encryption-key
```

```env
# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com
```

## Docker Environment

When using Docker, environment variables can be set in:
1. `.env` files (recommended)
2. `docker-compose.yml` under `environment:` section
3. Docker secrets (for production)

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists
- Verify network connectivity (Docker)

**CORS Errors**
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check that `FRONTEND_URL` matches your actual frontend domain
- Verify no trailing slashes in URLs

**OAuth2 Redirect URI Mismatch**
- Ensure `SITE_DOMAIN` matches your backend URL exactly
- Check redirect URIs in OAuth2 application settings
- Verify protocol (http vs https) matches

**Encryption Errors**
- Ensure `FIELD_ENCRYPTION_KEY` is set and valid
- Don't change the key after data is encrypted
- Use the same key across all environments for the same database

For more information, see:
- [Setup Guide](SETUP.md) - Initial configuration
- [OAuth2 Public API](oauth2-public-api.md) - OAuth2 configuration

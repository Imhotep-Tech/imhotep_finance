# ⚙️ Environment Variables

Make sure to configure .env files for both the backend and frontend.

## Backend (.env)

```env
# Option A: Single DATABASE_URL
DATABASE_URL=postgres://ta_connect_user:ta_connect_password@localhost:5432/ta_connect_db

# Or Option B: Separate DB vars (used by Docker)
DB_HOST=db
DB_PORT=5432
DB_NAME=ta_connect_db
DB_USER=ta_connect_user
DB_PASSWORD=ta_connect_password

SECRET_KEY=change-me
JWT_SECRET=change-me
DEBUG=1
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Email configuration
MAIL_PASSWORD=your-email-app-password

# Google OAuth & Calendar Integration (optional)
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
GOOGLE_CALENDAR_CONNECT_REDIRECT_URI=http://localhost:8000/api/auth/google/calendar/callback/

# Field Encryption (required)
# Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY=your-generated-fernet-key

# Push Notifications (VAPID keys)
# Generate: npm install -g web-push && web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

## Frontend (.env)

```env
# Vite projects use VITE_* prefix
VITE_API_URL=http://localhost:8000

# App URL (for SEO meta tags, sitemap, and social sharing)
# Set this to your domain when self-hosting
# Default: https://taconnect.netlify.app
VITE_APP_URL=https://your-domain.com

# Google Search Console Verification (optional)
# Get your code from: https://search.google.com/search-console
# Only the verification code is needed (not the full meta tag)
VITE_GOOGLE_SITE_VERIFICATION=your-verification-code

# Push Notifications
# Must match VAPID_PUBLIC_KEY from backend
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key

# Tally Form Integration (Feedback & Bugs)
# Get your form ID from your Tally form share URL: https://tally.so/forms/YOUR_FORM_ID/share
VITE_TALLY_FORM_ID=your-tally-form-id
```

## 🌐 Self-Hosting SEO Configuration

When self-hosting TAConnect, you can fully customize the SEO and search engine settings:

### App URL (`VITE_APP_URL`)
This URL is used for:
- Canonical URLs for SEO
- Open Graph meta tags (Facebook, LinkedIn sharing)
- Twitter Card meta tags
- Sitemap generation (`sitemap.xml`)
- Robots.txt sitemap reference
- JSON-LD structured data

```env
# Examples:
VITE_APP_URL=https://ta.youruniversity.edu
VITE_APP_URL=https://taconnect.yourdomain.com
```

### Google Search Console (`VITE_GOOGLE_SITE_VERIFICATION`)
To verify your self-hosted instance with Google:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain as a property
3. Choose "HTML tag" verification method
4. Copy just the `content` value from the meta tag
5. Add it to your `.env` file

```env
# If Google gives you: <meta name="google-site-verification" content="ABC123XYZ" />
VITE_GOOGLE_SITE_VERIFICATION=ABC123XYZ
```

> 💡 **Note:** The `sitemap.xml` and `robots.txt` are automatically generated during build with your configured `VITE_APP_URL`.

## Generating Required Keys

### Encryption Key (Backend)
```bash
pip install django-encrypted-model-fields
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### VAPID Keys (Push Notifications)
```bash
# Using Node.js
npm install -g web-push
web-push generate-vapid-keys

# Or using Python
pip install py-vapid
vapid --gen
```

> ⚠️ **Note:** VAPID keys must be shared between frontend and backend. The public key goes in both `.env` files, while the private key stays only in the backend.


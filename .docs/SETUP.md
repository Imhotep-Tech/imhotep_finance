# 🚀 Setup Guide

Complete setup instructions for Imhotep Finance, covering Docker (recommended) and manual installation options.

## Prerequisites

- **Docker & Docker Compose** – [Install Docker](https://docs.docker.com/get-docker/) (recommended for easy deployment)
- **Git** – [Install Git](https://git-scm.com/downloads)

## Initial Setup

Before running the project, copy the environment example file:

**Linux/Mac:**
```bash
cp backend/imhotep_finance/.env.example backend/imhotep_finance/.env
```

**Windows (Command Prompt):**
```cmd
copy backend\imhotep_finance\.env.example backend\imhotep_finance\.env
```

**Windows (PowerShell):**
```powershell
Copy-Item backend\imhotep_finance\.env.example backend\imhotep_finance\.env
```

Then edit `backend/imhotep_finance/.env` with your configuration.

### Generate Encryption Key

The project uses `django-encrypted-model-fields` for encrypting sensitive transaction data. You must generate a Fernet encryption key:

**Install the package (if not using Docker):**
```bash
pip install django-encrypted-model-fields
```

**Generate the key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Add to your `.env` file:**
```env
FIELD_ENCRYPTION_KEY='your-generated-key-here'
```

> ⚠️ **Important:** Keep this key secure and never commit it to version control. If you lose this key, encrypted data cannot be recovered.

## Setup with Docker (Recommended)

Docker provides the easiest way to run Imhotep Finance. It handles all dependencies and ensures a consistent environment.

```bash
git clone https://github.com/Imhotep-Tech/imhotep_finance.git
cd imhotep_finance
docker compose up --build
```

**Access Points:**
- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- Swagger Docs → http://localhost:8000/swagger/
- Django Admin → http://localhost:8000/admin/
- Developer Portal → http://localhost:3000/developer

> 💡 **Production Tip**: For production deployment, update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in your `.env` file to match your domain.

---

## 🧰 Manual Setup (Alternative)

If you prefer not to use Docker, you can set up Imhotep Finance manually. This gives you more control over the environment.

### Backend Setup

```bash
cd backend/imhotep_finance
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Generate encryption key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add the generated key to your `.env` file as `FIELD_ENCRYPTION_KEY`.

**Set up database and run migrations:**
```bash
python manage.py migrate
python manage.py createsuperuser  # Optional: Create admin user
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend/imhotep_finance
npm install
npm run dev
```

### Environment Configuration

See [Environment Variables](ENVIRONMENT_VARIABLES.md) for detailed configuration options including:
- Database settings
- JWT authentication
- Google OAuth integration
- Email configuration
- Field encryption keys

---

## 🗄️ Database Setup

### PostgreSQL (Recommended)

Imhotep Finance uses PostgreSQL as the database. When using Docker, PostgreSQL is automatically configured. For manual setup:

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE imhotep_finance;
   CREATE USER imhotep_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE imhotep_finance TO imhotep_user;
   ```

3. Update your `.env` file with database credentials

### Running Migrations

```bash
# Using Docker
docker exec imhotep_finance-backend-1 python manage.py migrate

# Manual setup
python manage.py migrate
```

---

## 🔐 Initial Configuration

### Create Superuser (Admin)

```bash
# Using Docker
docker exec -it imhotep_finance-backend-1 python manage.py createsuperuser

# Manual setup
python manage.py createsuperuser
```

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback/` (development)
   - `https://yourdomain.com/api/auth/google/callback/` (production)
6. Add credentials to `backend/imhotep_finance/.env`:
   ```env
   GOOGLE_OAUTH2_CLIENT_ID=your-client-id
   GOOGLE_OAUTH2_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback/
   ```

---

## ✅ Verification

After setup, verify everything is working:

1. **Backend**: Visit http://localhost:8000/admin/ and log in with your superuser account
2. **Frontend**: Visit http://localhost:3000 and create a new account
3. **API Docs**: Visit http://localhost:8000/swagger/ to see the API documentation
4. **Developer Portal**: Visit http://localhost:3000/developer to access the OAuth2 developer portal

---

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 8000 are already in use:
- Change ports in `docker-compose.yml` or
- Stop the conflicting service

### Database Connection Errors

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and user has proper permissions

### Migration Errors

- Make sure all dependencies are installed
- Run `python manage.py makemigrations` if you've modified models
- Check for conflicting migrations

### Frontend Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 20+)
- Verify all environment variables are set

---

## 📱 Mobile App Setup

The Imhotep Finance mobile app is built with React Native and Expo, providing native iOS and Android experiences.

### Prerequisites

- **Node.js 20+** – [Download](https://nodejs.org/)
- **npm** or **yarn** – Comes with Node.js
- **Expo Go app** (for testing):
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Optional (for native development):**
- **Android Studio** – For Android emulator
- **Xcode** – For iOS simulator (macOS only)

### Installation

```bash
# Navigate to mobile app directory
cd frontend/imhotep_finance_mobile

# Install dependencies
npm install
```

### Environment Configuration

The mobile app automatically selects the backend API URL:

1. **Development mode**: Uses local IP (e.g., `http://10.218.226.170:8000`)
2. **Production mode**: Uses production URL (e.g., `https://imhotepf.pythonanywhere.com`)

To override, create a `.env` file in `frontend/imhotep_finance_mobile/`:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
```

> 💡 **Tip**: For local development on physical devices, update `constants/api.ts` with your machine's local IP address (not `localhost`).

### Running the Mobile App

```bash
# Start Expo development server
npx expo start
```

**Run on your device:**
- 📱 **Expo Go**: Scan QR code with Expo Go app
- 🤖 **Android Emulator**: Press `a` in terminal
- 🍎 **iOS Simulator**: Press `i` in terminal (macOS only)
- 🌐 **Web Browser**: Press `w` in terminal

### Mobile App Troubleshooting

**Metro Bundler Issues:**
```bash
npx expo start --clear
```

**Module Not Found:**
```bash
rm -rf node_modules
npm install
```

**API Connection Issues:**
- Verify backend is running at the configured URL
- For physical devices, ensure device is on same network as backend
- Use local network IP instead of `localhost`

> 📘 **For detailed mobile app documentation**, see **[Mobile App Guide](MOBILE_APP.md)**

---

For more detailed information, see:
- [Mobile App Guide](MOBILE_APP.md) - Complete mobile app documentation
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Complete configuration guide
- [Folder Structure](FOLDER_STRUCTURE.md) - Project organization
- [Testing Guide](TESTING.md) - Running and writing tests

# 🚀 Setup Guide

## 🏠 Self-Hostable Platform

**TAConnect is 100% self-hostable** - you can deploy it on your own infrastructure with complete control over your data. This guide covers both Docker (recommended) and manual setup options.

## Prerequisites
- **Docker & Docker Compose** – [Install Docker](https://docs.docker.com/get-docker/) (recommended for easy deployment)
- **Git** – [Install Git](https://git-scm.com/downloads)

## Initial Setup

Before running the project, copy the environment example file:

**Linux/Mac:**
```bash
cp backend/ta_connect/.env.example backend/ta_connect/.env
```

**Windows (Command Prompt):**
```cmd
copy backend\ta_connect\.env.example backend\ta_connect\.env
```

**Windows (PowerShell):**
```powershell
Copy-Item backend\ta_connect\.env.example backend\ta_connect\.env
```

Then edit `backend/ta_connect/.env` with your configuration.

### Generate Encryption Key

The project uses `django-encrypted-model-fields` for encrypting sensitive data. You must generate a Fernet encryption key:

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

### Generate VAPID Keys (Push Notifications)

TAConnect uses Web Push API for real-time browser notifications. You need to generate VAPID (Voluntary Application Server Identification) keys.

**Option 1: Using web-push (Node.js):**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

**Option 2: Using py-vapid (Python):**
```bash
pip install py-vapid
vapid --gen
```

**Add to your backend `.env` file:**
```env
VAPID_PUBLIC_KEY='your-generated-public-key'
VAPID_PRIVATE_KEY='your-generated-private-key'
```

**Add to your frontend `.env` file (create if not exists):**
```env
VITE_VAPID_PUBLIC_KEY='your-generated-public-key'
```

> ⚠️ **Important:** The `VITE_VAPID_PUBLIC_KEY` in frontend must match `VAPID_PUBLIC_KEY` in backend.

## Setup with Docker (Recommended)

Docker provides the easiest way to self-host TAConnect. It handles all dependencies and ensures a consistent environment.

```bash
git clone https://github.com/labubou/TAConnect.git
cd TAConnect
docker compose up --build
```

**Access Points:**
- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- Swagger Docs → http://localhost:8000/swagger/
- Django Admin → http://localhost:8000/admin/

> 💡 **Self-Hosting Tip**: For production deployment, update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in your `.env` file to match your domain. You can deploy this Docker setup on any server, cloud provider, or your institution's infrastructure.

---

## 🧰 Manual Setup (Alternative)

If you prefer not to use Docker, you can set up TAConnect manually. This gives you more control over the environment and is useful for custom deployments or when Docker isn't available.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Generate encryption key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add the generated key to your `.env` file as `FIELD_ENCRYPTION_KEY`.

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Frontend Environment (Optional)

Create `frontend/ta_connect/.env` for push notifications:
```bash
cp frontend/ta_connect/.env.example frontend/ta_connect/.env
```

Edit the file and set `VITE_VAPID_PUBLIC_KEY` to match your backend's `VAPID_PUBLIC_KEY`.

### SEO Configuration (Self-Hosting)

For self-hosted deployments, configure your domain for proper SEO:

```bash
# In frontend/ta_connect/.env
VITE_APP_URL=https://your-domain.com
VITE_GOOGLE_SITE_VERIFICATION=your-google-verification-code  # optional
```

This ensures:
- ✅ Correct canonical URLs
- ✅ Proper social media sharing (Open Graph, Twitter Cards)
- ✅ Auto-generated `sitemap.xml` and `robots.txt` with your domain
- ✅ Google Search Console verification (if configured)

See [Environment Variables](ENVIRONMENT_VARIABLES.md) for detailed SEO configuration.


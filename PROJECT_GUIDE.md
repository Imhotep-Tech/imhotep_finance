# 🛠️ Imhotep Finance Project Guide

Welcome to the **Imhotep Finance Technical Documentation**. This guide covers everything you need to set up, develop, test, and contribute to the project.

---

## 📚 Documentation

Complete documentation is available in the `.docs/` folder:

| Document | Description |
|----------|-------------|
| [🚀 Setup Guide](.docs/SETUP.md) | Prerequisites, Docker & manual installation, initial configuration |
| [📱 Mobile App Guide](.docs/MOBILE_APP.md) | React Native app setup, development, and deployment |
| [📘 API Documentation](.docs/API_DOCUMENTATION.md) | Swagger/OpenAPI docs, JWT authorization, endpoint reference |
| [🔌 OAuth2 Public API](.docs/oauth2-public-api.md) | Complete guide for third-party developers, OAuth2 integration |
| [⚙️ Environment Variables](.docs/ENVIRONMENT_VARIABLES.md) | Backend & frontend configuration, production setup |
| [🧩 Folder Structure](.docs/FOLDER_STRUCTURE.md) | Project organization and architecture |
| [🧪 Testing Guide](.docs/TESTING.md) | Running & writing tests, test structure |
| [👥 Contributing](.docs/CONTRIBUTING.md) | How to contribute, code style, PR guidelines |
| [🧱 Development Workflow](.docs/DEVELOPMENT_WORKFLOW.md) | Development practices, CI/CD, best practices |

---

## 🚀 Quick Start

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) (for web application)
- [Node.js 20+](https://nodejs.org/) (for mobile app)
- [Git](https://git-scm.com/downloads)

### Setup

```bash
git clone https://github.com/Imhotep-Tech/imhotep_finance.git
cd imhotep_finance
cp backend/imhotep_finance/.env.example backend/imhotep_finance/.env
```

**Generate the encryption key:**
```bash
pip install django-encrypted-model-fields
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add the generated key to `backend/imhotep_finance/.env` as `FIELD_ENCRYPTION_KEY`.

**Configure Google OAuth (Optional):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback/` (for development)
   - `https://yourdomain.com/api/auth/google/callback/` (for production)
6. Add credentials to `backend/imhotep_finance/.env`

```bash
docker compose up --build
```

### Access Points

**Web Application:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/swagger/ |
| Developer Portal | http://localhost:3000/developer |
| Django Admin | http://localhost:8000/admin/ |

**Mobile App:**
```bash
cd frontend/imhotep_finance_mobile
npm install
npx expo start
```

- 📱 Scan QR code with Expo Go app
- 🤖 Press `a` for Android emulator
- 🍎 Press `i` for iOS simulator (macOS only)
- 🌐 Press `w` for web browser

See [Mobile App Guide](.docs/MOBILE_APP.md) for detailed mobile setup instructions.

---

## 🧪 Testing

Imhotep Finance includes **~240+ tests** covering models, views, serializers, and services.

```bash
# Run all tests
docker exec imhotep_finance-backend-1 python manage.py test

# Run specific app
docker exec imhotep_finance-backend-1 python manage.py test accounts

# Verbose output
docker exec imhotep_finance-backend-1 python manage.py test --verbosity=2
```

See [Testing Guide](.docs/TESTING.md) for comprehensive documentation.

---

## 🤝 Contributing

```bash
git checkout -b feature/your-feature
git commit -m "Add: your feature"
git push origin feature/your-feature
```

See [Contributing Guide](.docs/CONTRIBUTING.md) for details.

---

## 🏠 Self-Hosting

Imhotep Finance is designed to be **100% self-hostable**. You can deploy it on:
- Your own servers
- Cloud providers (AWS, Azure, GCP, DigitalOcean, etc.)
- Your infrastructure
- Any environment where you have control

All data stays on your servers - no external dependencies or vendor lock-in. See the [Setup Guide](.docs/SETUP.md) for deployment instructions.

## 📖 Additional Resources

- [README.md](README.md) – Project overview and quick start
- [Security Policy](SECURITY.md) – Security reporting guidelines
- [Code of Conduct](CODE_OF_CONDUCT.md) – Community guidelines
- [License](LICENSE) – License information

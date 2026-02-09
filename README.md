<div align="center">

# 💰 Imhotep Finance

### Smart Personal Finance Management Platform

[![Project Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)](https://github.com/Imhotep-Tech/imhotep_finance)
[![License](https://img.shields.io/badge/License-Dual%20License-blue?style=for-the-badge)](LICENSE)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.x-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Django CI/CD](https://github.com/Imhotep-Tech/imhotep_finance/actions/workflows/django-ci.yml/badge.svg)](https://github.com/Imhotep-Tech/imhotep_finance/actions/workflows/django-ci.yml)
[![codecov](https://codecov.io/gh/Imhotep-Tech/imhotep_finance/branch/main/graph/badge.svg)](https://codecov.io/gh/Imhotep-Tech/imhotep_finance)

**Take control of your finances. Track spending. Achieve your goals.**

[Features](#-features) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Tech Stack](#-tech-stack)

</div>

---

## 📖 About

**Imhotep Finance** is an open-source personal finance management platform built with Django, React, and React Native. It provides both a powerful web application and a native mobile app to help you track transactions, manage budgets, set savings goals, and automate recurring expenses. Perfect for individuals seeking a secure, user-friendly way to monitor spending, analyze patterns, and achieve financial freedom—anytime, anywhere.

> *"Your finances, simplified. Your goals, achieved."*

### 🏠 Self-Hostable - Deploy Anywhere

Imhotep Finance is designed to be **completely self-hostable** with no external dependencies or vendor lock-in. You have full control:

- **Deploy anywhere**: Your own server, cloud provider (AWS, Azure, GCP), or your infrastructure
- **Complete data ownership**: All data stays on your servers - no third-party services required
- **Privacy first**: No tracking, no analytics sent to external services
- **Free to use**: Use it for free for any purpose (personal or commercial within your organization)
- **Easy setup**: One-command Docker deployment or manual installation

See the [Setup Guide](.docs/SETUP.md) for detailed deployment instructions.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 💳 Financial Tracking
- Deposit and withdraw funds
- Detailed transaction history
- Smart category suggestions
- Multi-currency support
- CSV import/export

</td>
<td width="50%">

### 📊 Analytics & Insights
- Spending pattern analysis
- Income/expense pie charts
- Monthly and yearly reports
- Net worth tracking
- Financial trends visualization

</td>
</tr>
<tr>
<td width="50%">

### 🎯 Goal Setting
- Monthly savings targets
- Wishlist management
- Progress tracking
- Goal scoring system
- Achievement milestones

</td>
<td width="50%">

### ⚡ Automation
- Scheduled transactions
- Recurring bills automation
- Monthly income automation
- Smart category detection
- Automated net worth calculation

</td>
</tr>
<tr>
<td width="50%">

### 🔐 Security & Privacy
- JWT authentication
- Google OAuth integration
- Encrypted sensitive data
- Secure API endpoints
- User data isolation

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Modern UI/UX
- Dark/Light theme toggle
- Fully responsive design
- Interactive charts
- Accessible components
- PWA support

</td>
<td width="50%">

### 🛠️ Developer Friendly
- Swagger API documentation
- Docker one-command setup
- Comprehensive test suite
- Modular architecture
- **100% self-hostable**

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Web Application

```bash
# Clone the repository
git clone https://github.com/Imhotep-Tech/imhotep_finance.git
cd imhotep_finance

# Copy environment file
cp backend/imhotep_finance/.env.example backend/imhotep_finance/.env

# Generate encryption key (required)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Add the generated key to backend/imhotep_finance/.env as FIELD_ENCRYPTION_KEY

# Start with Docker
docker compose up --build
```

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000 |
| 📚 API Docs (Swagger) | http://localhost:8000/swagger/ |
| 🔧 Developer Portal | http://localhost:3000/developer |
| 👤 Django Admin | http://localhost:8000/admin/ |

### 📱 Mobile App

```bash
# Navigate to mobile app directory
cd frontend/imhotep_finance_mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Run on your device:**
- 📱 **Expo Go**: Scan QR code with Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- 🤖 **Android Emulator**: Press `a` in terminal
- 🍎 **iOS Simulator**: Press `i` in terminal (macOS only)
- 🌐 **Web Browser**: Press `w` in terminal

> 📘 For detailed setup instructions, see **[Setup Guide](.docs/SETUP.md)** and **[Mobile App Guide](.docs/MOBILE_APP.md)**

---

## 📚 Documentation

Comprehensive documentation is available in the `.docs/` folder:

| Document | Description |
|----------|-------------|
| [🚀 Setup Guide](.docs/SETUP.md) | Prerequisites, Docker & manual installation, initial configuration |
| [📱 Mobile App Guide](.docs/MOBILE_APP.md) | React Native app setup, development, and deployment |
| [📘 API Documentation](.docs/API_DOCUMENTATION.md) | Swagger/OpenAPI docs, JWT authorization, endpoint reference |
| [⚙️ Environment Variables](.docs/ENVIRONMENT_VARIABLES.md) | Backend & frontend configuration, production setup |
| [🧩 Folder Structure](.docs/FOLDER_STRUCTURE.md) | Project organization and architecture |
| [🧪 Testing Guide](.docs/TESTING.md) | Running & writing tests, test structure |
| [👥 Contributing](.docs/CONTRIBUTING.md) | How to contribute, code style, PR guidelines |
| [🧱 Development Workflow](.docs/DEVELOPMENT_WORKFLOW.md) | Development practices, CI/CD, best practices |

---

## 🏗️ Tech Stack

<div align="center">

| Web Frontend | Mobile App | Backend | Database | DevOps |
|:------------:|:----------:|:-------:|:--------:|:------:|
| React 19 | React Native 0.81 | Django 5.2 | PostgreSQL | Docker |
| Vite | Expo 54.x | Django REST Framework | | Docker Compose |
| Tailwind CSS | TypeScript | JWT Auth | | |
| React Router | Expo Router | drf-spectacular | | |
| Axios | Axios | | | |

</div>

---

## 🖼️ Screenshots

<div align="center">
  <img width="1730" height="889" alt="Landing Page" src="https://github.com/user-attachments/assets/c2055670-8cbd-44fc-a349-372ab5be0f8a" />
  <p><em>Landing Page</em></p>

  <img width="1727" height="969" alt="Dashboard" src="https://github.com/user-attachments/assets/235f3c77-73af-4b56-9162-032740b1ccb0" />
  <p><em>Dashboard with transaction overview</em></p>

  <img width="1727" height="969" alt="Transactions" src="https://github.com/user-attachments/assets/5ce73361-c498-4c85-b9fe-5776e208e2c3" />
  <p><em>Transaction history</em></p>
  
  <img width="1727" height="969" alt="Monthly Reports" src="https://github.com/user-attachments/assets/97ca7695-2554-40fa-8327-25bc8f3e89b7" />
  <p><em>Monthly Reports</em></p>
</div>


## 👥 Contributing

We welcome contributions to Imhotep Finance! Here's how you can contribute:

1. **Fork the repository** and create your feature branch
2. **Make your changes** and test them thoroughly
3. **Commit your changes** with clear messages
4. **Push to your branch** and open a Pull Request

See [Contributing Guide](.docs/CONTRIBUTING.md) for detailed guidelines.

---

## 🧪 Testing

Imhotep Finance includes **~240+ tests** covering models, views, serializers, and services.

```bash
# Run all backend tests
docker exec imhotep_finance-backend-1 python manage.py test

# Run specific app tests
docker exec imhotep_finance-backend-1 python manage.py test accounts
```

See [Testing Guide](.docs/TESTING.md) for comprehensive testing documentation.

---

## 📝 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the expectations for participation in our community.

---

## 🔒 Security

We take security seriously. If you discover a security vulnerability, please report it responsibly:

- Email: imhoteptech@outlook.com
- Include detailed description and steps to reproduce
- We will acknowledge within 1-3 business days

See [Security Policy](SECURITY.md) for more details.

---

## 📄 License

This project uses a dual-licensing approach:
- **GNU Affero General Public License v3.0 (AGPL-3.0)** for non-commercial use and contributions
- **Commercial License** for commercial use, redistribution, or use in commercial products/services

For commercial licensing inquiries, please contact **imhoteptech@outlook.com**.

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with ❤️ by Imhotep Tech**

*"Take control of your finances. Achieve your goals."*

[Documentation](.docs/) • [API Docs](http://localhost:8000/swagger/) • [Developer Portal](http://localhost:3000/developer)

</div>

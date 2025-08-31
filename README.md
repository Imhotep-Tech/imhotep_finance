# Imhotep Financial Manager

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-green.svg)](https://github.com/Imhotep-Tech/imhotep_finance)
[![License](https://img.shields.io/badge/License-Dual-blue.svg)](LICENSE)

A comprehensive financial management web application that helps you track transactions, manage deposits and withdrawals, create wishlists, and set financial goals with intelligent automation and advanced analytics. Now powered by Django and React for enhanced performance, security, and scalability.


## 💰 Features

### Core Financial Management
- **Financial Tracking**: Easily deposit and withdraw funds with detailed transaction history
- **Smart Categories**: Enhanced transaction categorization with intelligent suggestions based on your most frequent categories
- **Transaction Analysis**: View and analyze your spending patterns with detailed pie charts for expenses and income categories

### Automation & Intelligence
- **Scheduled Transactions**: Set up automated monthly recurring transactions for bills, income, and regular expenses
- **Smart Suggestions**: Category recommendations based on your transaction history and patterns
- **Error Handling**: Comprehensive error management system with user-friendly custom error pages

### Goal Setting & Planning
- **Wishlist Management**: Create and prioritize items you want to purchase with detailed tracking
- **Goal Setting**: Set monthly savings targets to help achieve your financial objectives
- **Financial Analytics**: Advanced charts and visualizations to understand your spending habits

### User Experience
- **Multi-Currency Support**: Support for multiple currencies with real-time exchange rates
- **Responsive Design**: Optimized experience across desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Enhanced Navigation**: Improved mobile navigation with better responsiveness
- **Modern UI/UX**: Clean, intuitive interface with modern design patterns

### Security & Performance
- **Advanced Security**: CSRF protection, JWT authentication, and enhanced security measures
- **Performance Optimized**: Fast loading times with React's efficient rendering and Django's robust backend
- **Google OAuth**: Secure login with Google account integration
- **Data Backup**: Automated database backup system for data protection
- **Docker Support**: Containerized deployment for easy setup and scalability

## 🖼️ Screenshots

<div align="center">
  <!--Main Page-->
  <img width="1730" height="889" alt="Screenshot from 2025-08-31 12-07-04" src="https://github.com/user-attachments/assets/c2055670-8cbd-44fc-a349-372ab5be0f8a" />
  <p><em>Landing Page</em></p>

  <!--Login-->
  <img width="1727" height="969" alt="Screenshot from 2025-08-31 12-07-18" src="https://github.com/user-attachments/assets/5b60f4f1-d90d-4842-9739-8dad34be524f" />
  <p><em>Login Page</em></p>

  <!--Dashboard-->
  <img width="1727" height="969" alt="Screenshot from 2025-08-31 12-28-37" src="https://github.com/user-attachments/assets/235f3c77-73af-4b56-9162-032740b1ccb0" />
  <p><em>Dashboard with transaction overview</em></p>

  <!--Transactions -->
  <img width="1727" height="969" alt="Screenshot from 2025-08-31 12-30-19" src="https://github.com/user-attachments/assets/5ce73361-c498-4c85-b9fe-5776e208e2c3" />
  <p><em>Transaction history</em></p>
  
  <!--Monthly Reports -->
  <img width="1727" height="969" alt="Screenshot from 2025-08-31 12-30-25" src="https://github.com/user-attachments/assets/97ca7695-2554-40fa-8327-25bc8f3e89b7" />
  <p><em>Monthly Reports</em></p>
  
</div>

## 🔧 Technology Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Django REST Framework
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose
- **Authentication**: JWT, Google OAuth

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### Setup with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Imhotep-Tech/imhotep_finance.git
   cd imhotep_finance
   ```

2. **Set up environment variables**
   Create `.env` files for backend and frontend as needed (adapt from your project structure).

3. **Launch the application**
   ```bash
   docker compose up --build
   ```

   This will:
   - Set up PostgreSQL database
   - Build and run the Django backend API
   - Build and run the React frontend
   - Enable hot reloading for development

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin/

### Manual Setup (Alternative)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Imhotep-Tech/imhotep_finance.git
   cd imhotep_finance
   ```

2. **Backend Setup (Django)**
   - Install Python 3.11+
   - Create virtual environment and install dependencies
   - Set up PostgreSQL database
   - Run migrations and start server

3. **Frontend Setup (React)**
   - Install Node.js 20+
   - Install dependencies with `npm install`
   - Start development server with `npm run dev`

4. **Environment Variables**
   Create `.env` files with necessary configurations (DATABASE_URL, SECRET_KEY, etc.).

## 👥 Contributing

We welcome contributions to Imhotep Financial Manager! Here's how you can contribute:

1. **Fork the repository** and create your feature branch
   ```
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** and test them thoroughly

3. **Commit your changes**
   ```
   git commit -m 'Add some amazing feature'
   ```

4. **Push to your branch**
   ```
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request** describing your changes and their benefits

### Development Setup

Follow the Docker or manual setup instructions above. For Docker:
- Hot reloading is enabled for live code changes
- Volumes are mounted for instant updates
- Debug mode is active for both frontend and backend

## 📝 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the expectations for participation in our community.

## 📄 License

This project uses a dual-licensing approach:
- GNU Affero General Public License v3.0 (AGPL-3.0) for non-commercial use and contributions
- Commercial License for commercial use, redistribution, or use in commercial products/services

For commercial licensing inquiries, please contact imhoteptech@outlook.com.

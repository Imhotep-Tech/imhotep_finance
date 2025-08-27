# Imhotep Financial Manager (Under Development)

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-green.svg)](https://github.com/yourusername/imhotep_finance)
[![License](https://img.shields.io/badge/License-Dual-blue.svg)](LICENSE)

A comprehensive financial management web application that helps you track transactions, manage deposits and withdrawals, create wishlists, and set financial goals with intelligent automation and advanced analytics.

## 💰 Features

### Core Financial Management
- **Financial Tracking**: Easily deposit and withdraw funds with detailed transaction history
- **Smart Categories**: Enhanced transaction categorization with intelligent suggestions based on your most frequent categories
- **Transaction Analysis**: View and analyze your spending patterns with detailed pie charts for expenses and income categories
- **Data Export**: Export your transaction data to CSV format for external analysis and record-keeping

### Automation & Intelligence
- **Scheduled Transactions**: Set up automated monthly recurring transactions for bills, income, and regular expenses
- **Smart Suggestions**: AI-powered category recommendations based on your transaction history and patterns
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
- **Advanced Security**: CSRF protection and enhanced security measures
- **Performance Optimized**: Fast loading times and optimized user experience
- **Google OAuth**: Secure login with Google account integration
- **Data Backup**: Automated database backup system for data protection

## 🖼️ Screenshots

<div align="center">
  <!--Main Page-->
  <img src="https://github.com/user-attachments/assets/34e1e1c5-b6c3-4765-bfd7-8a0ac9af862f" alt="Goals Setting" width="700"/>
  <p><em>Landing Page</em></p>

  <!--Login-->
  <img src="https://github.com/user-attachments/assets/b095332b-e3a9-45ba-886e-2a197dda2ba8" alt="Goals Setting" width="700"/>
  <p><em>Login Page</em></p>

  <!--Dashboard-->
  <img src="https://github.com/user-attachments/assets/7fc74e14-1468-4d69-9aef-d3fd882f724f" alt="Goals Setting" width="700"/>
  <p><em>Dashboard with transaction overview</em></p>

  <!--Transactions -->
  <img src="https://github.com/user-attachments/assets/1aa2f117-83af-4d31-ad22-b050cea258dd" alt="Transaction History" width="700"/>
  <p><em>Transaction history and analytics</em></p>
  
  <!--Monthly Reports -->
  <img src="https://github.com/user-attachments/assets/02a243a5-423b-42b7-85df-678a6b6720ee" alt="Dashboard View" width="700"/>
  <p><em>Monthly Reports</em></p>
  
</div>

## 🔧 Technology Stack

- Frontend: Jinja syntax, Javascript, tailwindcss, Bootstrap
- Backend: Flask
- Database: MYSql
- Deployment: Pythonanywhere

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

1. Clone the repository
   ```
   git clone https://github.com/Imhotep-Tech/imhotep_finance.git
   cd imhotep_finance
   ```

2. Install dependencies
   ```
   pip install -r requirements.txt
   ```

3. Database Setup
   - Create a MySQL or PostgreSQL database for the application
   - Make sure you have a database user with appropriate permissions

4. Environment Variables
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=mysql://username:password@localhost/database_name
   MAIL_PASSWORD=your_email_service_password
   EXCHANGE_API_KEY_PRIMARY=your_exchange_rate_api_key
   SECRET_KEY=your_flask_secret_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   ```

5. Start the development server
   ```
   flask run --debug
   ```

## 📝 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the expectations for participation in our community.

## 📄 License

This project uses a dual-licensing approach:
- GNU Affero General Public License v3.0 (AGPL-3.0) for non-commercial use and contributions
- Commercial License for commercial use, redistribution, or use in commercial products/services

For commercial licensing inquiries, please contact imhoteptech@outlook.com.

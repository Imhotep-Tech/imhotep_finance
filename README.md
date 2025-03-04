# Imhotep Financial Manager

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-green.svg)](https://github.com/yourusername/imhotep_finance)
[![License](https://img.shields.io/badge/License-Dual-blue.svg)](LICENSE)

A comprehensive financial management web application that helps you track transactions, manage deposits and withdrawals, create wishlists, and set financial goals.

## 💰 Features

- **Financial Tracking**: Easily deposit and withdraw funds with detailed transaction history
- **Transaction Analysis**: View and analyze your spending patterns over time
- **Wishlist Management**: Create and prioritize items you want to purchase
- **Goal Setting**: Set monthly savings targets to help achieve your financial objectives
- **Currency Options**: Support for multiple currencies to match your location preferences
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🖼️ Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/ecba65cd-f60a-4dfe-8c6d-e325fde38c4b" alt="Dashboard View" width="700"/>
  <p><em>Dashboard with transaction overview</em></p>
  
  <img src="https://github.com/user-attachments/assets/21535dc7-42ec-41fe-9b53-6c35bbd358cf" alt="Transaction History" width="700"/>
  <p><em>Transaction history and analytics</em></p>
  
  <img src="https://github.com/user-attachments/assets/33bf89b6-9429-4e6d-b526-e0f74f8192f7" alt="Goals Setting" width="700"/>
  <p><em>Financial goals and wishlist management</em></p>
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

## ☕ Support Development

If you've found Imhotep Financial Manager helpful for managing your finances, please consider supporting its continued development:

<div align="center">
  <a href="https://ko-fi.com/kbassem10" target="_blank">
 <img src="https://storage.ko-fi.com/cdn/kofi3.png?v=3" alt="Buy Me a Coffee at ko-fi.com" height="50" style="margin-right: 20px;">
  </a>
  <a href="https://www.buymeacoffee.com/kbassem10" target="_blank">
 <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50">
  </a>
</div>

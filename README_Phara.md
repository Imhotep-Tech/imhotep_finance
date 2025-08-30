<div align="center">

# 👑 Pharaohfolio

*Simple hosting for single-page portfolios — by Imhotep Tech*

[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

**The easiest way to host your AI-generated portfolio — no technical skills required** 

*Generate your portfolio with ChatGPT, Claude, or any AI assistant → Paste the code → Get your live link instantly!*

[🚀 Quick Start](#-quick-start-for-contributors) • [✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📱 Demo](#-demo) • [🤝 Contributing](#-contributing)

---

</div>

## ✨ Features

🤖 **AI-Generated Code Support** - Works with any AI assistant (ChatGPT, Claude, Gemini, etc.)  
📋 **Simple Paste & Deploy** - Just paste your HTML/CSS/JS code and get a live link  
🌐 **Instant Hosting** - Your portfolio goes live at `pharaohfolio.vercel.app/u/username` immediately  
💻 **Built-in Code Editor** - Monaco editor for quick tweaks and customizations  
👁️ **Live Preview** - See your portfolio in real-time as you edit  
🔐 **Secure Authentication** - Email/password and Google OAuth for account management  
📱 **Mobile-Optimized** - All hosted portfolios work perfectly on mobile devices  
🛡️ **Safe Code Execution** - HTML/CSS/JS sanitization to prevent malicious code  
📊 **Simple Analytics** - Basic visit tracking for your portfolio  
⚡ **Lightning Fast** - Instant deployment with global CDN delivery  

## 🛠️ Tech Stack

### Backend
- **Django REST Framework** - Robust API for code storage and deployment
- **PostgreSQL** - Reliable storage for user accounts and portfolio code
- **JWT Authentication** - Secure token-based authentication
- **Code Sanitization** - Security layer to clean HTML/CSS/JS
- **Docker** - Containerized development and deployment

### Frontend
- **React 19** - Modern component-based UI
- **Vite** - Lightning-fast development server
- **Tailwind CSS** - Beautiful, responsive design
- **Monaco Editor** - Professional code editing experience
- **React Router** - Smooth navigation between pages

### Infrastructure
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server (planned)
- **CDN Integration** - Fast global content delivery (planned)

## 📱 How It Works

### 🤖 Step 1: Generate with AI
Ask any AI assistant like ChatGPT:
> "Create me a portfolio website for a web developer with HTML, CSS, and JavaScript. Include sections for about me, projects, and contact."

### 📋 Step 2: Paste Your Code  
Copy the generated HTML, CSS, and JavaScript code and paste it into Pharaohfolio's editor.

### 🚀 Step 3: Get Your Link
Hit "Deploy" and get your instant live link: `pharaohfolio.vercel.app/u/yourusername`

### ✨ Step 4: Share & Shine
Share your professional portfolio with clients, employers, or friends!

---

## 🎯 Perfect For

- 🎨 **Artists & Designers** - Showcase your creative work without coding
- 💼 **Freelancers** - Professional portfolios that convert clients  
- 🎓 **Students** - Academic projects and resume portfolios
- 🚀 **Entrepreneurs** - Quick business and startup showcases
- 📝 **Writers & Bloggers** - Content portfolios and personal brands
- 👩‍💻 **Anyone** - Who wants a professional web presence without the hassle

---

## 🚀 Quick Start for Contributors

> **Get the hosting platform running in less than 2 minutes!** 🚀

### 🔧 Prerequisites
- 🐳 **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- 📦 **Git** - [Install Git](https://git-scm.com/downloads)

### ⚡ Setup (One Command!)

**1. Clone & Navigate**
```bash
git clone https://github.com/your-username/Pharaohfolio.git
cd Pharaohfolio
```

**2. Set Up Environment Variables** 🔑
Create environment files for both backend and frontend:

```bash
# Backend environment setup
cd backend/Pharaohfolio
cat > .env << 'EOF'
DEBUG=True
SECRET_KEY='+)#=j8tkch25z^on!=567&^6eyqyn9fgg3mbzypay+g^18vh)5'

# Google OAuth Configuration (Optional - for Google login)
GOOGLE_CLIENT_ID='your_google_client_id_here'
GOOGLE_CLIENT_SECRET='your_google_client_secret_here'
GOOGLE_REDIRECT_URI='http://localhost:8000/api/auth/google/callback/'

# Email Configuration (Optional - for notifications)
MAIL_PASSWORD='your_app_password_here'

# Database Configuration (Docker)
DATABASE_NAME='pharaohfolio_db'
DATABASE_USER='pharaohfolio_user'
DATABASE_PASSWORD='pharaohfolio_password'
DATABASE_HOST='db'

# Optional AI Integration (for future AI features)
GEMINI_API_KEY_1='your_gemini_api_key_here'
GEMINI_API_KEY_2='your_second_gemini_api_key_here'
EOF

# Frontend environment setup
cd ../../frontend/Pharaohfolio
cat > .env << 'EOF'
# Frontend Environment Variables
VITE_API_URL=http://localhost:8000
EOF

# Return to project root
cd ../..
```

**3. Launch the Platform** ✨
```bash
docker compose up --build
```

**That's it! 🎉 Your portfolio hosting platform is ready!**

### 🎯 What This Does

✅ **Database Setup** - PostgreSQL container (port 5432)  
✅ **Backend API** - Django REST API (http://localhost:8000)  
✅ **Frontend App** - React application (http://localhost:3000)  
✅ **Code Editor** - Monaco editor for HTML/CSS/JS  
✅ **Admin Panel** - Django admin with demo credentials  
✅ **Auto-Migration** - Database schema setup  
✅ **Hot Reload** - Live code changes during development  

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 **Frontend** | http://localhost:3000 | Main portfolio hosting interface |
| ⚡ **Backend API** | http://localhost:8000 | REST API endpoints |
| 🔧 **Django Admin** | http://localhost:8000/admin/ | Admin panel (admin/admin123) |
| 🗄️ **Database** | localhost:5432 | PostgreSQL instance |

---

## 🔧 Manual Setup (Alternative)

> **Prefer hands-on control? Follow these detailed steps!**

### 📋 Prerequisites for Manual Setup
- 🐍 **Python 3.11+** - [Download Python](https://python.org/downloads/)
- 📦 **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- 🗄️ **PostgreSQL 15+** - [Install PostgreSQL](https://postgresql.org/download/)
- 📦 **Git** - [Install Git](https://git-scm.com/downloads/)

### 📝 Step-by-Step Manual Setup

#### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/your-username/Pharaohfolio.git
cd Pharaohfolio
```

#### 2️⃣ **Set Up PostgreSQL Database**
```bash
# 🚀 Start PostgreSQL service
sudo systemctl start postgresql  # Linux
# or
brew services start postgresql   # macOS

# 🗄️ Create database and user
sudo -u postgres psql
CREATE DATABASE pharaohfolio_db;
CREATE USER pharaohfolio_user WITH PASSWORD 'pharaohfolio_password';
GRANT ALL PRIVILEGES ON DATABASE pharaohfolio_db TO pharaohfolio_user;
\q
```

#### 3️⃣ **Set Up Backend (Django)**
```bash
# 📂 Navigate to backend directory
cd backend/Pharaohfolio

# 🐍 Create virtual environment
python -m venv venv

# ⚡ Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# 📦 Install dependencies
pip install -r requirements.txt

# 🔄 Create environment variables (.env file)
# Copy the .env content from Step 2 above, but change DATABASE_HOST to 'localhost'

# 🗄️ Run migrations
python manage.py makemigrations accounts
python manage.py makemigrations portfolio
python manage.py makemigrations
python manage.py migrate

# 👤 Create superuser
python manage.py createsuperuser

# 🚀 Start development server
python manage.py runserver
```

#### 4️⃣ **Set Up Frontend (React)**
```bash
# 🆕 Open new terminal and navigate to frontend directory
cd frontend/Pharaohfolio

# 📦 Install dependencies
npm install

# 🌐 Create environment variables (.env file)
echo "VITE_API_URL=http://localhost:8000" > .env

# 🚀 Start development server
npm run dev
```

#### 5️⃣ **Access the Application**

| Service | URL | Status |
|---------|-----|--------|
| 🎨 **Frontend** | http://localhost:3000 | ✅ Ready |
| ⚡ **Backend API** | http://localhost:8000 | ✅ Ready |
| 🔧 **Django Admin** | http://localhost:8000/admin | ✅ Ready |

---

## ⚙️ Development

**🔧 Development Mode Features:**
- 🔄 **Hot reloading** for both frontend and backend
- 📁 **Volume mounting** for live code changes  
- 🐛 **Debug mode** enabled
- 🎨 **Live CSS updates** with Tailwind
- ⚡ **Fast refresh** in React
- 💻 **Code editor testing** with Monaco integration

**🛑 Stop the application:**
```bash
docker compose down
```

**📜 View logs:**
```bash
docker compose logs -f
```

**🔄 Rebuild after dependency changes:**
```bash
docker compose up --build
```

---

## 🚨 Troubleshooting

### 🔌 Port Conflicts
> **Issue**: "address already in use" errors

**💡 Solution:**
```bash
# Check what's using the ports
sudo lsof -i :3000  # Frontend port
sudo lsof -i :8000  # Backend port  
sudo lsof -i :5432  # Database port

# Stop conflicting services
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

### 🛠️ Manual Setup Issues

| Problem | Solution |
|---------|----------|
| 🗄️ **Database connection failed** | Verify PostgreSQL is running & credentials are correct |
| 🐍 **Python import errors** | Ensure virtual environment is activated |
| 📦 **Node.js version issues** | Update to Node.js 20+ |
| 🔐 **Permission denied** | Check file permissions and user access |

### 🐳 Docker Setup Issues

| Problem | Solution |
|---------|----------|
| 🚀 **Container build fails** | Run `docker system prune -a` and retry |
| 🗄️ **Database connection timeout** | Wait for health check to complete |
| 📱 **Frontend not loading** | Check if port 3000 is available |
| ⚡ **Hot reload not working** | Restart container with `docker compose restart` |
| 🔧 **API calls failing** | Verify frontend `.env` has `VITE_API_URL=http://localhost:8000` |

---

## 🤝 Contributing

We welcome contributions from developers who want to help make portfolio hosting accessible to everyone! 

### 🎯 How to Contribute

1. 🍴 **Fork** the repository
2. 🌟 **Create** a feature branch (`git checkout -b feature/awesome-hosting-feature`)
3. 📝 **Commit** your changes (`git commit -m 'Add awesome hosting feature'`)
4. 📤 **Push** to the branch (`git push origin feature/awesome-hosting-feature`)
5. 🔄 **Open** a Pull Request

### 🐛 Found a Bug?
Open an issue with:
- 📝 Clear description
- 🔄 Steps to reproduce
- 💻 System information
- 📸 Screenshots (if applicable)

### 💡 Have an Idea?
We'd love to hear it! Open an issue with the `enhancement` label.

### 🎨 Areas for Contribution
- **Code Security** - Better HTML/CSS/JS sanitization
- **Performance** - Faster deployment and hosting
- **UI/UX** - Better code editor experience
- **Templates** - Pre-built portfolio templates
- **Analytics** - Enhanced visitor tracking
- **Mobile** - Mobile app development

---

## 🌟 Why Pharaohfolio?

**The Problem:** Most people can easily get beautiful portfolio code from AI assistants like ChatGPT, but they have no idea how to host it online.

**Our Solution:** Pharaohfolio bridges that gap. Simply paste your AI-generated code and get an instant, live portfolio link. No servers, no deployment headaches, no technical knowledge required.

**Perfect for:**
- 🎨 **Non-technical creators** who want professional web presence
- ⚡ **Quick deployment** of AI-generated portfolios
- 💰 **Cost-effective hosting** without monthly fees
- 🔧 **Simple maintenance** - just update your code anytime
- 📱 **Mobile-ready** portfolios that work everywhere

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Show Your Support

If you find Pharaohfolio helpful, please consider:
- ⭐ **Starring** this repository
- 🍴 **Forking** to contribute
- 🐛 **Reporting** issues
- 💡 **Suggesting** new features
- 📱 **Sharing** with non-technical friends who need portfolios

---

<div align="center">

**Made with ❤️ by Imhotep Tech**

*Democratizing web hosting, one portfolio at a time!* 👑✨

[⬆ Back to Top](#-pharaohfolio)

</div>

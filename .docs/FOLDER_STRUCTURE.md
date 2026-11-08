# 🧩 Folder Structure

Complete overview of the Imhotep Finance project structure.

```
imhotep_finance/
│
├── backend/
│   ├── imhotep_finance/          # Django project root
│   │   ├── accounts/             # User authentication & profiles
│   │   │   ├── tests/            # Test package
│   │   │   │   ├── test_apis.py
│   │   │   │   ├── test_serializers.py
│   │   │   │   └── test_services.py
│   │   │   ├── auth/             # Google OAuth integration
│   │   │   ├── models.py         # User, UserProfile models
│   │   │   ├── apis.py           # Authentication APIs
│   │   │   ├── serializers.py   # API serializers
│   │   │   ├── services.py      # Business logic
│   │   │   └── urls.py
│   │   ├── finance_management/   # Core finance features
│   │   │   ├── models.py         # NetWorth, Category models
│   │   │   ├── apis.py           # Finance APIs
│   │   │   ├── services.py      # Networth calculation
│   │   │   └── utils/           # Currency, category utilities
│   │   ├── transaction_management/  # Transaction CRUD
│   │   │   ├── tests/            # Comprehensive test suite
│   │   │   ├── models.py         # Transactions model
│   │   │   ├── apis.py           # Transaction APIs
│   │   │   ├── services.py      # Create, update, delete logic
│   │   │   ├── selectors.py     # Query optimization
│   │   │   └── urls.py
│   │   ├── scheduled_trans_management/  # Recurring transactions
│   │   │   ├── models.py         # ScheduledTransaction model
│   │   │   ├── apis.py           # Scheduled transaction APIs
│   │   │   ├── services.py      # Scheduling logic
│   │   │   └── selectors.py
│   │   ├── target_management/    # Savings goals
│   │   │   ├── models.py         # Target model
│   │   │   ├── apis.py           # Target APIs
│   │   │   └── services.py      # Goal tracking logic
│   │   ├── wishlist_management/   # Wishlist features
│   │   │   ├── models.py         # Wishlist model
│   │   │   ├── apis.py           # Wishlist APIs
│   │   │   └── services.py
│   │   ├── user_reports/         # Financial reports
│   │   │   ├── models.py         # UserReport model
│   │   │   ├── apis.py           # Report APIs
│   │   │   └── services.py      # Report generation
│   │   ├── imhotep_finance/      # Django settings
│   │   │   ├── settings.py       # Main settings
│   │   │   ├── settings_test.py  # Test-specific settings
│   │   │   ├── urls.py           # URL routing
│   │   │   ├── wsgi.py
│   │   │   └── asgi.py
│   │   ├── requirements.txt      # Python dependencies
│   │   ├── manage.py
│   │   └── Dockerfile
│   │
├── frontend/
│   ├── imhotep_finance/          # React app root (Vite)
│   │   ├── src/
│   │   │   ├── components/       # React components
│   │   │   │   ├── common/       # Shared components
│   │   │   │   │   ├── Navbar.jsx
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   ├── ThemeToggle.jsx
│   │   │   │   │   ├── LanguageToggle.jsx
│   │   │   │   │   └── ...
│   │   │   │   └── pwa/          # PWA components
│   │   │   ├── pages/            # Page components
│   │   │   │   ├── auth/         # Authentication pages
│   │   │   │   ├── main/         # Main app pages
│   │   │   │   └── profile/      # User profile pages
│   │   │   ├── contexts/         # React contexts
│   │   │   │   ├── AuthContext.jsx
│   │   │   │   ├── ThemeContext.jsx
│   │   │   │   └── LanguageContext.jsx
│   │   │   ├── locales/          # Modular i18n JSON translations
│   │   │   │   ├── en/           # English module JSON files
│   │   │   │   ├── ar/           # Arabic module JSON files
│   │   │   │   └── index.js      # Locale aggregator & language configuration
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── config/           # Configuration
│   │   │   │   └── api.js        # API client setup
│   │   │   └── utils/            # Utility functions
│   │   ├── public/               # Static assets
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   └── Dockerfile
│   │
│   ├── imhotep_finance_mobile/   # React Native app (Expo)
│   │   ├── app/                  # File-based routing (Expo Router)
│   │   │   ├── (auth)/          # Authentication screens
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   ├── forgot-password.tsx
│   │   │   │   └── verify-email.tsx
│   │   │   ├── (tabs)/          # Main app tabs
│   │   │   │   ├── index.tsx    # Dashboard
│   │   │   │   ├── transactions.tsx
│   │   │   │   ├── reports.tsx
│   │   │   │   ├── wishlist.tsx
│   │   │   │   ├── scheduled.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── _layout.tsx      # Root layout
│   │   │   └── +not-found.tsx   # 404 page
│   │   ├── components/          # Reusable components
│   │   │   ├── common/         # Common UI components
│   │   │   ├── forms/          # Form components
│   │   │   └── transactions/   # Transaction components
│   │   ├── constants/          # App constants
│   │   │   ├── api.ts         # API configuration
│   │   │   ├── Colors.ts      # Color palette
│   │   │   └── types.ts       # TypeScript types
│   │   ├── contexts/          # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── LanguageContext.tsx
│   │   ├── locales/           # Modular i18n JSON translations
│   │   │   ├── en/            # English module JSON files
│   │   │   ├── ar/            # Arabic module JSON files
│   │   │   └── index.ts       # Locale aggregator & language configuration
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── use-color-scheme.ts
│   │   │   ├── use-color-scheme.web.ts
│   │   │   └── use-theme-color.ts
│   │   ├── widgets/           # Android home-screen widgets
│   │   │   ├── NetWorthShortcutsWidget.tsx
│   │   │   └── widget-updater.tsx
│   │   ├── widget-task-handler.tsx # Android widget task registration handler
│   │   ├── assets/            # Images, fonts, icons
│   │   ├── app.json           # Expo configuration
│   │   ├── eas.json           # EAS Build configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
├── .docs/                        # Documentation
│   ├── SETUP.md                  # Setup guide
│   ├── MOBILE_APP.md             # Mobile app guide
│   ├── API_DOCUMENTATION.md      # API docs
│   ├── ENVIRONMENT_VARIABLES.md  # Environment config
│   ├── FOLDER_STRUCTURE.md       # This file
│   ├── TESTING.md                # Testing guide
│   ├── CONTRIBUTING.md           # Contribution guide
│   └── DEVELOPMENT_WORKFLOW.md   # Development workflow
│
├── docker-compose.yml            # Docker orchestration
├── README.md                     # Main project README
├── PROJECT_GUIDE.md              # Project overview
├── SECURITY.md                   # Security policy
├── CODE_OF_CONDUCT.md            # Code of conduct
└── LICENSE                       # License file
```

## Key Directories

### Backend Structure

- **`accounts/`**: User authentication, profiles, Google OAuth
- **`finance_management/`**: Core finance models (NetWorth, Categories)
- **`transaction_management/`**: Transaction CRUD operations
- **`scheduled_trans_management/`**: Recurring transaction automation
- **`target_management/`**: Savings goals and targets
- **`wishlist_management/`**: Wishlist items tracking
- **`user_reports/`**: Financial reports and analytics

### Frontend Structure

**Web Application (`imhotep_finance/`):**
- **`components/`**: Reusable React components
- **`pages/`**: Page-level components (routes)
- **`contexts/`**: React Context providers (Auth, Theme)
- **`config/`**: Configuration files (API client)
- **`utils/`**: Utility functions and helpers

**Mobile App (`imhotep_finance_mobile/`):**
- **`app/`**: File-based routing with Expo Router
  - **`(auth)/`**: Authentication screens (login, register, verify email)
  - **`(tabs)/`**: Main app tabs (dashboard, transactions, reports, etc.)
- **`components/`**: Reusable React Native components
- **`constants/`**: API configuration, colors, TypeScript types
- **`contexts/`**: React Context for state management (AuthContext)
- **`hooks/`**: Custom React hooks for theme detection and layout styles (use-color-scheme, use-theme-color)
- **`widgets/`**: Android home-screen widget code (NetWorthShortcutsWidget)
- **`widget-task-handler.tsx`**: Android widget task handler registration
- **`assets/`**: Images, fonts, and icons

## Testing Structure

Each Django app follows a consistent testing structure:

```
app_name/
├── tests/
│   ├── __init__.py
│   ├── test_apis.py       # API endpoint tests
│   ├── test_serializers.py  # Serializer validation tests
│   └── test_services.py   # Business logic tests
```

## Configuration Files

- **`backend/imhotep_finance/.env`**: Backend environment variables
- **`frontend/imhotep_finance/.env`**: Frontend environment variables
- **`docker-compose.yml`**: Docker service configuration
- **`requirements.txt`**: Python dependencies
- **`package.json`**: Node.js dependencies

For more details on specific components, see:
- [Setup Guide](SETUP.md) - Installation instructions
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Development practices
- [Testing Guide](TESTING.md) - Testing structure and practices

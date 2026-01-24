# 🧩 Folder Structure

```
TAConnect/
│
├── backend/
│   ├── ta_connect/             # Django project root
│   │   ├── accounts/           # Django app: user accounts
│   │   │   ├── tests/          # Test package
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py     # Base test class
│   │   │   │   ├── test_models.py
│   │   │   │   ├── test_views.py
│   │   │   │   └── test_forms.py
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── ...
│   │   ├── instructor/        # Django app: instructor features
│   │   │   ├── tests/          # Test package
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py     # Base test class
│   │   │   │   ├── test_models.py
│   │   │   │   ├── test_views.py
│   │   │   │   └── test_forms.py
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── ...
│   │   ├── student/            # Django app: student features
│   │   │   ├── tests/          # Test package
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py     # Base test class
│   │   │   │   ├── test_models.py
│   │   │   │   ├── test_views.py
│   │   │   │   └── test_forms.py
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── ...
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── settings_test.py    # Test-specific settings (SQLite, no throttling)
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   ├── asgi.py
│   │   └── ...
│   ├── requirements.txt
│   ├── manage.py
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── ta_connect/             # React app root (Vite)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── General/
│   │   │   │   │   ├── PushNotificationToggle.jsx  # Push notification UI
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   │   ├── usePushNotifications.js  # Push notification hook
│   │   │   │   └── ...
│   │   │   ├── pages/
│   │   │   ├── strings/
│   │   │   │   ├── pushNotificationStrings.js  # i18n strings
│   │   │   │   └── ...
│   │   │   ├── utils/
│   │   │   │   ├── pushNotifications.js  # Push utility functions
│   │   │   │   └── ...
│   │   │   ├── config/
│   │   │   └── index.css
│   │   ├── public/
│   │   │   ├── sw.js           # Service worker for push notifications
│   │   │   └── ...
│   │   ├── package.json
│   │   ├── .env.example        # Environment variables template
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── vite.config.js
│   │   ├── Dockerfile
│   │   └── ...
│   └── ...
│
├── docker-compose.yml
├── TAConnect_full_project_plan.csv
├── README.md
├── PROJECT_GUIDE.md
├── LICENSE.md
└── ...
```


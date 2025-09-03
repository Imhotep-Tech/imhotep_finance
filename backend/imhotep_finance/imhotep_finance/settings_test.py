from .settings import *  # import your base settings

# Override DATABASES to use SQLite for tests (since PostgreSQL isn't available in CI)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # Use in-memory SQLite for faster tests
    }
}

# Silence only noisy HTTP request error logs during tests
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "null": {
            "class": "logging.NullHandler",
        },
    },
    "loggers": {
        "django.request": {  # This is what prints Bad Request/Not Found/500
            "handlers": ["null"],
            "level": "CRITICAL",
            "propagate": False,
        },
    },
}

from .settings import *  # import your base settings

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

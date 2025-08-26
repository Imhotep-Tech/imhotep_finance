import os

# PythonAnywhere specific settings
DEBUG = False
TESTING = False

# Static files configuration for PythonAnywhere
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

# Additional security settings for production
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Content Security Policy for canvas elements
CSP_DEFAULT_SRC = "'self'"
CSP_SCRIPT_SRC = "'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com"
CSP_STYLE_SRC = "'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com"
CSP_FONT_SRC = "'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com"
CSP_IMG_SRC = "'self' data:"

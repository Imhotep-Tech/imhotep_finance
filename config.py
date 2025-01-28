import os
from datetime import timedelta
from flask_wtf import FlaskForm
import logging

class Config:
    SECRET_KEY = os.getenv('secret_key')
    DATABASE_URL = os.getenv("DATABASE_URL")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")  # Add this line
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(days=365)
    SESSION_REFRESH_EACH_REQUEST = True
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'myapp_session:'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_TYPE = 'filesystem'
    SESSION_REFRESH_EACH_REQUEST = True  # Refresh session timeout with each request
    MAX_CONTENT_LENGTH = 3 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "user_photo")
    ALLOWED_EXTENSIONS = ("png", "jpg", "jpeg")
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

class CSRFForm(FlaskForm):
    pass
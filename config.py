import os
from datetime import timedelta
from flask_wtf import FlaskForm
import logging

#the configs
class Config:
    #the secret key from the venv 
    SECRET_KEY = os.getenv('secret_key')

    #db connection string
    DATABASE_URL = os.getenv("DATABASE_URL")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") 

    #making the session PERMANENT for one year
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(days=365)

    #the session config
    SESSION_REFRESH_EACH_REQUEST = True
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'myapp_session:'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_TYPE = 'filesystem'
    SESSION_REFRESH_EACH_REQUEST = True

    # the file config
    MAX_CONTENT_LENGTH = 3 * 1024 * 1024
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "user_photo")
    ALLOWED_EXTENSIONS = ("png", "jpg", "jpeg")

    #the password mail
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

#the csrf class for the protection
class CSRFForm(FlaskForm):
    pass
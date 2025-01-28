from flask_session import Session
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
import os

# Initialize extensions
sess = Session()
csrf = CSRFProtect()

limiter = Limiter(
    get_remote_address,  # This will limit based on the IP address of the requester
    default_limits=["200 per day", "50 per hour"]  # Set default rate limits
)

db = SQLAlchemy()

oauth = OAuth()
google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

def init_extensions(app):
    sess.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)
    db.init_app(app)
    oauth.init_app(app)
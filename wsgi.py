import sys
import os

os.environ['DATABASE_URL'] = 'postgresql://kbassem:kb@localhost/imhotep_finance'
os.environ['MAIL_PASSWORD'] = 'hrsw vzhz cixd eecs'
os.environ['EXCHANGE_API_KEY_PRIMARY'] = '2a4f75a189d39f96688afc97'
os.environ['EXCHANGE_API_KEY_SECONDARY'] = '18c9f74feadb9bea7bf26ce4'

# Add the directory containing your Flask application to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Assuming your Flask application is named 'app' and the Flask instance is created in 'app.py'
from app import app as application  # Replace 'app' with the actual name of your Flask instance

# This will be the entry point for WSGI servers like Gunicorn
if __name__ == "__main__":
    application.run()

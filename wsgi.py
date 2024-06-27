# wsgi.py

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app as application  

if __name__ == "__main__":
    application.run()

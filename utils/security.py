from flask import render_template, redirect, Flask, session, request, make_response, url_for
from extensions import db
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash

def logout():
        """Log out the user by clearing all session data."""
        session.permanent = False #disable permanent session
        session["logged_in"] = False #set logged in status to false
        session.pop('rate', None) #remove rate from session if exists
        session.pop('rate_expire', None) #remove rate expiration from session if exists
        session.clear() #clear all session data

def security_check(user_id, check_pass):
    """Verify user password for security operations."""
    password_db = db.session.execute(
                text("SELECT user_password FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()[0] #get hashed password from database

    if check_password_hash(password_db, check_pass): #verify password against database
        return True #password is correct
    else:
        return False #password is incorrect
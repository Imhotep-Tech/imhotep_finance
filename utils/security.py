from flask import render_template, redirect, Flask, session, request, make_response, url_for
from extensions import db
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash

def logout():
        session.permanent = False
        session["logged_in"] = False
        session.pop('rate', None)
        session.pop('rate_expire', None)
        session.clear()

def security_check(user_id, check_pass):
    password_db = db.session.execute(
                text("SELECT user_password FROM users WHERE user_id = :user_id"),
                {"user_id" :user_id}
            ).fetchone()[0]

    if check_password_hash(password_db, check_pass):
        return True
    else:
        return False
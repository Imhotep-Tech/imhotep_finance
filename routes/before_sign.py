from flask import Blueprint, render_template
from extensions import db
from sqlalchemy import text
from config import CSRFForm

before_sign_bp = Blueprint('before_sign', __name__)

@before_sign_bp.route('/before_sign')
def before_sign():
    # Landing page data
    features = [
        {
            'icon': 'fas fa-chart-line',
            'title': 'Track Your Finances',
            'description': 'Monitor your income, expenses, and investments in real-time with beautiful charts and analytics.'
        },
        {
            'icon': 'fas fa-piggy-bank',
            'title': 'Smart Savings',
            'description': 'Set financial goals and track your progress with our intelligent savings recommendations.'
        },
        {
            'icon': 'fas fa-exchange-alt',
            'title': 'Multi-Currency Support',
            'description': 'Manage finances in multiple currencies with automatic conversion and exchange rates.'
        },
        {
            'icon': 'fas fa-shield-alt',
            'title': 'Secure & Private',
            'description': 'Your financial data is protected with bank-level security and encryption.'
        }
    ]
    
    users_count_db = db.session.execute(
            text("SELECT COUNT(*) FROM users")
            ).fetchone()

    try:
        users_count = users_count_db[0]
    except:
        users_count = 0

    return render_template('before_sign.html', form=CSRFForm(), features=features, users_count=users_count)

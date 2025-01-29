from flask import render_template, redirect, Flask, session, make_response
import datetime
from flask_talisman import Talisman
from config import CSRFForm, Config
from extensions import init_extensions
from routes.google_sign import google_sign_bp
from routes.login import login_bp
from routes.register import register_bp
from routes.settings import settings_bp
from routes.transactions import transactions_bp
from routes.user import user_bp
from routes.wishlist import wishlist_bp
from routes.before_sign import before_sign_bp

#define the app
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)

    # Register blueprints
    app.register_blueprint(google_sign_bp)
    app.register_blueprint(login_bp)
    app.register_blueprint(register_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(before_sign_bp)

    return app

app = create_app()

@app.before_request
def refresh_session():
    session.permanent = True  # Keep the session permanent for every request

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True  # Ensure cookies are only sent over HTTPS
)

# Define your CSP policy
csp = {
    'default-src': "'self'",
    'script-src': [
        "'self'",
        "https://cdn.jsdelivr.net",  # Allow Bootstrap and Font Awesome
        "https://cdn.tailwindcss.com",  # Allow Tailwind CSS CDN
        "'unsafe-inline'",  # Allow inline scripts (needed for some Bootstrap features)
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",  # Allow inline styles (necessary for Bootstrap)
        "https://cdn.jsdelivr.net",  # Allow Bootstrap CSS
        "https://cdnjs.cloudflare.com"  # Allow Font Awesome
    ],
    'font-src': [
        "'self'", 
        "https://cdnjs.cloudflare.com",  # Allow Font Awesome fonts
        "https://fonts.gstatic.com"  # If using Google Fonts
    ],
    'img-src': ["'self'", "data:"],  # Add any other domains as necessary
    'connect-src': ["'self'"],  # Add any other domains for AJAX calls if necessary
}


# Set up Talisman with the CSP configuration
Talisman(app, content_security_policy=csp)

#error handling

@app.errorhandler(404)
def page_not_found(error):
    return render_template('error_handle.html', error_code = "404", error_description = "We can't find that page."), 404

@app.errorhandler(400)
def session_expired(error):
    return render_template('error_handle.html', error_code = "400", error_description= "Session Expired."), 400

@app.errorhandler(429)
def request_amount_exceed(error):
    return render_template('error_handle.html', error_code = "429", error_description= "You exceeded the Maximum amount of requests! Please Try Again Later"), 429

@app.errorhandler(405)
def page_not_found(error):
    return render_template('error_handle.html', error_code = "405", error_description = "Method Not Allowed."), 405

@app.errorhandler(Exception)
def server_error(error):
    return render_template('error_handle.html', error_code = "500", error_description = "Something went wrong."), 500

@app.errorhandler(500)
def internal_server_error(error):
    return render_template('error_handle.html', error_code = "500", error_description="Something Went Wrong."), 500

#the main route
@app.route("/", methods=["GET"])
def index():
    #if logged in return to the home
    if session.get("logged_in"):
        return redirect("/home")
    else:
        #if not logged in redirect to the before sign in page
        return redirect("/before_sign")

#the version page
@app.route("/version")
def version():
    return render_template("version.html", form=CSRFForm())

#the download page
@app.route("/download")
def download():
    return render_template("download.html", form=CSRFForm())

#the terms and conditions page
@app.route("/terms")
def terms():
    return render_template("terms.html",form=CSRFForm())

#the privacy page
@app.route("/privacy")
def privacy():
    return render_template("privacy.html",form=CSRFForm())

#some headers for security
@app.after_request
def add_header(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response

@app.after_request
def remove_csp_header(response):
    if 'Content-Security-Policy' in response.headers:
        del response.headers['Content-Security-Policy']
    return response

@app.after_request
def set_content_type_options(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

#the sitemap of the webapp
@app.route('/sitemap.xml')
def sitemap():
    pages = []

    ten_days_ago = (datetime.datetime.now() - datetime.timedelta(days=10)).date().isoformat()
    for rule in app.url_map.iter_rules():
        if "GET" in rule.methods and len(rule.arguments) == 0:
            pages.append(
                ["https://imhotepf.pythonanywhere.com" + str(rule.rule), ten_days_ago]
            )

    sitemap_xml = render_template('sitemap.xml', pages=pages)
    response = make_response(sitemap_xml)
    response.headers["Content-Type"] = "application/xml"

    return response

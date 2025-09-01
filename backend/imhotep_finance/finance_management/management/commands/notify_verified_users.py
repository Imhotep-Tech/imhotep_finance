import sqlite3
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.template import Template, Context
from django.conf import settings

class Command(BaseCommand):
    help = "Notify verified users from the old database about the new Imhotep Finance app"

    def add_arguments(self, parser):
        parser.add_argument("sqlite_db", type=str, help="Path to the old SQLite database")
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of emails to send (for testing)",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Send only to this email (for testing)",
        )

    def handle(self, *args, **options):
        sqlite_db = options["sqlite_db"]
        limit = options["limit"]
        target_email = options["email"]

        self.stdout.write(self.style.NOTICE(f"Connecting to old SQLite database at: {sqlite_db}"))

        conn = sqlite3.connect(sqlite_db)
        cursor = conn.cursor()

        # Select only verified users
        cursor.execute(
            "SELECT user_username, user_mail FROM users WHERE user_mail_verify = 'verified'"
        )
        verified_users = cursor.fetchall()

        conn.close()

        # Apply filters
        if target_email:
            verified_users = [u for u in verified_users if u[1] == target_email]
        if limit:
            verified_users = verified_users[:limit]

        self.stdout.write(self.style.SUCCESS(f"Found {len(verified_users)} users to notify."))

        # HTML email template (with placeholders)
        html_template = Template("""<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Imhotep Finance!</title>
        <style>
        :root { --teal:#366c6b; --dark-slate:#1a3535; --muted:#9ca3a3; }
        body { font-family: Arial, Helvetica, sans-serif; background:#f4f9f9; padding:20px; }
        .container { max-width:650px; margin:0 auto; background:#fff; padding:2rem; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.08); }
        .header { text-align:center; margin-bottom:1.5rem; }
        .logo { font-size:2rem; font-weight:800; color:var(--teal); }
        .subtitle { color:var(--muted); margin-bottom:1rem; }
        .button { display:inline-block; background:linear-gradient(135deg,var(--teal),var(--dark-slate)); color:#fff; text-decoration:none;
        padding:0.9rem 1.6rem; border-radius:10px; font-weight:700; margin:0.4rem; }
        .footer { margin-top:2rem; font-size:0.9rem; color:var(--muted); text-align:center; }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
                <div class="logo">Imhotep Finance</div>
                <p class="subtitle">Manage your finances efficiently with Imhotep Financial Manager</p>
                <h1>Welcome, {{ username }}!</h1>
            </div>
            <p>We’ve upgraded Imhotep Finance 🚀 to a faster and more modern version! 🎉</p>
            <p>You can access the new app at <strong>https://imhotep-finance.vercel.app/</strong>, and the old link will also redirect you there.</p>
            <p><strong>Important:</strong> For security reasons, you’ll need to reset your password before logging in.</p>
            <div style="text-align:center; margin:1.5rem 0;">
                <a href="{{ frontend_url }}/password-reset" class="button">🔑 Reset Password</a>
                <a href="{{ frontend_url }}" class="button">🚀 Go to App</a>
            </div>
            <p>If you have any questions, our support team is here to help.</p>
            <div class="footer">
                <p><strong>Imhotep Finance</strong> — Manage your finances efficiently</p>
                <p style="font-size:0.8rem;">This email was sent automatically. Please do not reply.</p>
            </div>
        </div>
        </body>
        </html>""")

        frontend_url = "https://imhotep-finance.vercel.app"

        # Loop through and send emails
        for username, email in verified_users:
            context = Context({
                "username": username,
                "frontend_url": frontend_url,
            })

            html_content = html_template.render(context)

            subject = "🚀 Imhotep Finance has been upgraded – reset your password"
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@imhotep-finance.com")
            to = [email]

            msg = EmailMultiAlternatives(subject, "", from_email, to)
            msg.attach_alternative(html_content, "text/html")

            msg.send()
            self.stdout.write(self.style.SUCCESS(f"✅ Sent email to {email}"))

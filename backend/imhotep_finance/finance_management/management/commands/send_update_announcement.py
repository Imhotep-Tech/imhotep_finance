import json
import os
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from accounts.models import User

class Command(BaseCommand):
    help = "Send update announcement emails to all verified users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--updates-file",
            type=str,
            default="updates.json",
            help="Path to the updates JSON file (default: updates.json in project root)",
        )
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
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview email without sending",
        )

    def handle(self, *args, **options):
        updates_file = options["updates_file"]
        limit = options["limit"]
        target_email = options["email"]
        dry_run = options["dry_run"]

        # Build full path to updates file
        if not os.path.isabs(updates_file):
            # If relative path, look in project root
            base_dir = settings.BASE_DIR
            updates_path = os.path.join(base_dir, updates_file)
        else:
            updates_path = updates_file

        # Load updates data
        try:
            with open(updates_path, 'r', encoding='utf-8') as f:
                updates_data = json.load(f)
            self.stdout.write(self.style.SUCCESS(f"✅ Loaded updates from: {updates_path}"))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"❌ Updates file not found: {updates_path}"))
            return
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f"❌ Invalid JSON in updates file: {str(e)}"))
            return

        # Get verified users
        users = User.objects.filter(email_verify=True).exclude(username='demo')

        # Apply filters
        if target_email:
            users = users.filter(email=target_email)
        if limit:
            users = users[:limit]

        users_list = list(users)
        self.stdout.write(self.style.SUCCESS(f"📧 Found {len(users_list)} verified users to notify"))

        if dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN MODE - No emails will be sent"))
            if users_list:
                # Preview email for first user
                sample_user = users_list[0]
                html_content = render_to_string('update_announcement_email.html', {
                    'user': sample_user,
                    'title': updates_data.get('title', 'Updates'),
                    'version': updates_data.get('version', '1.0.0'),
                    'updates': updates_data.get('updates', []),
                    'cta_text': updates_data.get('cta_text', 'Learn More'),
                    'cta_url': updates_data.get('cta_url', 'https://imhotep-finance.vercel.app'),
                    'footer_note': updates_data.get('footer_note', 'Thank you!'),
                })
                self.stdout.write(self.style.SUCCESS("\n📧 Preview of email content:"))
                self.stdout.write(self.style.SUCCESS(f"To: {sample_user.email}"))
                self.stdout.write(self.style.SUCCESS(f"Subject: {updates_data.get('subject', 'Update Announcement')}"))
                self.stdout.write("\n" + "="*80 + "\n")
                # In production, you might want to save this to a file instead of printing
                self.stdout.write("HTML content rendered successfully (not displayed in terminal)")
                self.stdout.write("\n" + "="*80 + "\n")
            return

        # Send emails
        subject = updates_data.get('subject', 'New Updates - Imhotep Finance')
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'imhoteptech1@gmail.com')

        success_count = 0
        error_count = 0

        for user in users_list:
            try:
                # Render HTML email
                html_content = render_to_string('update_announcement_email.html', {
                    'user': user,
                    'title': updates_data.get('title', 'Updates'),
                    'version': updates_data.get('version', '1.0.0'),
                    'updates': updates_data.get('updates', []),
                    'cta_text': updates_data.get('cta_text', 'Learn More'),
                    'cta_url': updates_data.get('cta_url', 'https://imhotep-finance.vercel.app'),
                    'footer_note': updates_data.get('footer_note', 'Thank you!'),
                })

                # Create email
                msg = EmailMultiAlternatives(subject, "", from_email, [user.email])
                msg.attach_alternative(html_content, "text/html")
                msg.send()

                success_count += 1
                self.stdout.write(self.style.SUCCESS(f"✅ Sent to {user.email} ({user.username})"))

            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f"❌ Failed to send to {user.email}: {str(e)}"))

        # Summary
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS(f"📊 Summary:"))
        self.stdout.write(self.style.SUCCESS(f"   ✅ Successfully sent: {success_count}"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"   ❌ Failed: {error_count}"))
        self.stdout.write("="*80 + "\n")

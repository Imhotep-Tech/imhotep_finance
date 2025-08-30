import sqlite3
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from accounts.models import User
from finance_management.models import (
    Transactions,
    NetWorth,
    Wishlist,
    ScheduledTransaction,
    Target,
)


class Command(BaseCommand):
    help = "Migrate data from old SQLite backup into new Django models (reset passwords and wipe old data first)"

    def add_arguments(self, parser):
        parser.add_argument("sqlite_db", type=str, help="Path to the old SQLite database")
        parser.add_argument(
            "--default-password",
            type=str,
            default="changeme123",
            help="Default password for migrated users",
        )

    def handle(self, *args, **options):
        sqlite_db = options["sqlite_db"]
        default_password = options["default_password"]

        self.stdout.write(self.style.WARNING("⚠️  Deleting all existing data..."))

        # Wipe all existing data to avoid conflicts
        Transactions.objects.all().delete()
        NetWorth.objects.all().delete()
        Wishlist.objects.all().delete()
        ScheduledTransaction.objects.all().delete()
        Target.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()  # keep admin(s)

        self.stdout.write(self.style.SUCCESS("✅ Existing data wiped."))

        self.stdout.write(self.style.NOTICE(f"Using SQLite database at: {sqlite_db}"))

        conn = sqlite3.connect(sqlite_db)
        cursor = conn.cursor()

        # ---- Users ----
        cursor.execute("SELECT user_id, user_username, user_mail, favorite_currency, user_mail_verify FROM users")
        user_mapping = {}  # old_id -> new_user

        for old_id, username, email, favorite_currency, email_verify in cursor.fetchall():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                "email": email,
                "password": make_password(default_password),
                "favorite_currency": (favorite_currency or "USD")[:4],
                "email_verify": bool(email_verify),  # depends on your field name
            },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created user {username}"))
            else:
                self.stdout.write(self.style.WARNING(f"User {username} already existed"))
            user_mapping[old_id] = user

        # ---- Transactions ----
        cursor.execute(
            "SELECT trans_key, user_id, amount, currency, date, trans_status, trans_details, category FROM trans"
        )
        for _, old_user_id, amount, currency, date, status, details, category in cursor.fetchall():
            user = user_mapping.get(old_user_id)
            if not user:
                continue
            Transactions.objects.create(
                user=user,
                amount=float(amount) if amount else 0.0,
                currency=(currency or "USD")[:4],
                date=date or timezone.now().date(),
                trans_status=status.capitalize() if status else "Deposit",
                trans_details=details,
                category=category,
            )

        # ---- NetWorth ----
        cursor.execute("SELECT networth_id, user_id, currency, total FROM networth")
        for _, old_user_id, currency, total in cursor.fetchall():
            user = user_mapping.get(old_user_id)
            if not user:
                continue
            NetWorth.objects.create(
                user=user,
                currency=(currency or "USD")[:4],
                total=float(total) if total else 0.0,
            )

        # ---- Wishlist ----
        cursor.execute(
            "SELECT wish_key, user_id, currency, price, status, link, wish_details, year FROM wishlist"
        )
        for _, old_user_id, currency, price, status, link, details, year in cursor.fetchall():
            user = user_mapping.get(old_user_id)
            if not user:
                continue

            # Map string status -> BooleanField
            status_bool = False
            if status:
                status_lower = status.strip().lower()
                if status_lower in ["done", "purchased", "true", "1"]:
                    status_bool = True

            Wishlist.objects.create(
                user=user,
                price=float(price) if price else 0.0,
                currency=(currency or "USD")[:4],
                status=status_bool,
                link=link,
                wish_details=details,
                year=int(year) if year else timezone.now().year,
            )

        # ---- Scheduled Transactions ----
        cursor.execute(
            """SELECT scheduled_trans_key, user_id, currency, date, amount,
                      scheduled_trans_status, scheduled_trans_details, category, last_time_added, status
               FROM scheduled_trans"""
        )
        for (
            _,
            old_user_id,
            currency,
            date,
            amount,
            st_status,
            details,
            category,
            last_time,
            st_active,
        ) in cursor.fetchall():
            user = user_mapping.get(old_user_id)
            if not user:
                continue
            ScheduledTransaction.objects.create(
                user=user,
                currency=(currency or "USD")[:4],
                date=int(date) if date and str(date).isdigit() else timezone.now().day,
                amount=float(amount) if amount else 0.0,
                scheduled_trans_status=st_status.capitalize() if st_status else "Deposit",
                scheduled_trans_details=details,
                category=category,
                last_time_added=last_time or None,
                status=bool(st_active),
            )

        # ---- Targets ----
        cursor.execute("SELECT target_id, user_id, target, mounth, year, score FROM target")
        for _, old_user_id, target, month, year, score in cursor.fetchall():
            user = user_mapping.get(old_user_id)
            if not user:
                continue

            try:
                score_val = int(float(score)) if score else 0
            except (ValueError, TypeError):
                score_val = 0

            Target.objects.create(
                user=user,
                target=int(float(target)) if target else 0,
                month=int(float(month)) if month else timezone.now().month,
                year=int(float(year)) if year else timezone.now().year,
                score=score_val,
            )

        # ✅ close connection
        conn.close()

        self.stdout.write(self.style.SUCCESS("✅ Migration completed successfully (data wiped + passwords reset)"))

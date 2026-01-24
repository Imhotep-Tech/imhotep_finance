import os
import django
import json
from datetime import datetime
from django.db import connections
from django.utils import timezone
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imhotep_finance.settings')
django.setup()

from accounts.models import User
from transaction_management.models import Transactions, NetWorth
from scheduled_trans_management.models import ScheduledTransaction
from target_management.models import Target
from user_reports.models import Reports
from wishlist_management.models import Wishlist
from finance_management.models import BaseExchangeRate

def make_aware_if_needed(dt_value):
    """Helper to fix the naive datetime warnings"""
    if dt_value is None:
        return None
    # If it's a string (common in SQLite raw reads), parse it first
    if isinstance(dt_value, str):
        try:
            dt_value = datetime.fromisoformat(dt_value)
        except ValueError:
            # Handle formats like "2025-01-01 00:00:00" if isoformat fails
            dt_value = datetime.strptime(dt_value, "%Y-%m-%d %H:%M:%S")
            
    # If it's a naive datetime object, make it aware
    if timezone.is_naive(dt_value):
        return timezone.make_aware(dt_value)
    return dt_value

def fetch_all_from_sqlite(table_name):
    """Reads raw data from the sqlite backup"""
    with connections['backup_source'].cursor() as cursor:
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]

def run_migration():
    print("🚀 Starting Data Restoration & Encryption...")

    # 1. RESTORE USERS
    print("... Migrating Users")
    users_data = fetch_all_from_sqlite('accounts_user')
    for row in users_data:
        if not User.objects.filter(id=row['id']).exists():
            User.objects.create(
                id=row['id'],
                username=row['username'],
                email=row['email'],
                password=row['password'],
                is_superuser=row['is_superuser'],
                is_staff=row['is_staff'],
                is_active=row['is_active'],
                date_joined=make_aware_if_needed(row['date_joined']), 
                favorite_currency=row.get('favorite_currency', 'USD'),
                email_verify=row.get('email_verify', False)
            )

    # 2. RESTORE EXCHANGE RATES
    print("... Migrating Exchange Rates")
    rates_data = fetch_all_from_sqlite('finance_management_baseexchangerate')
    for row in rates_data:
        rates_val = json.loads(row['rates']) if isinstance(row['rates'], str) else row['rates']
        BaseExchangeRate.objects.create(
            id=row['id'],
            base_currency=row['base_currency'],
            rates=rates_val,
            last_updated=make_aware_if_needed(row['last_updated'])
        )
    
    # 3. RESTORE TRANSACTIONS
    print("... Migrating Transactions")
    trans_data = fetch_all_from_sqlite('finance_management_transactions')
    for row in trans_data:
        Transactions.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            date=row['date'], 
            amount=row['amount'],
            currency=row['currency'],
            trans_status=row['trans_status'],
            trans_details=row['trans_details'], 
            category=row['category'],
            created_at=make_aware_if_needed(row['created_at'])
        )

    # 4. RESTORE SCHEDULED TRANSACTIONS
    print("... Migrating Scheduled Transactions")
    sch_data = fetch_all_from_sqlite('finance_management_scheduledtransaction')
    for row in sch_data:
        ScheduledTransaction.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            date=row['date'],
            amount=row['amount'],
            currency=row['currency'],
            scheduled_trans_status=row['scheduled_trans_status'],
            scheduled_trans_details=row['scheduled_trans_details'],
            category=row['category'],
            last_time_added=make_aware_if_needed(row['last_time_added']), 
            status=row['status'],
            created_at=make_aware_if_needed(row['created_at'])
        )

    # 5. RESTORE TARGETS
    print("... Migrating Targets")
    target_data = fetch_all_from_sqlite('finance_management_target')
    for row in target_data:
        Target.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            target=row['target'],
            month=row['month'],
            year=row['year'],
            score=row['score'],
            created_at=make_aware_if_needed(row['created_at'])
        )

    # 6. RESTORE NETWORTH
    print("... Migrating NetWorth")
    net_data = fetch_all_from_sqlite('finance_management_networth')
    for row in net_data:
        NetWorth.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            total=row['total'],
            currency=row['currency'],
            created_at=make_aware_if_needed(row['created_at'])
        )

    # 7. RESTORE WISHLIST
    print("... Migrating Wishlist")
    wish_data = fetch_all_from_sqlite('finance_management_wishlist')
    for row in wish_data:
        Wishlist.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            transaction_id=row['transaction_id'],
            year=row['year'],
            price=row['price'],
            currency=row['currency'],
            status=row['status'],
            link=row['link'],
            wish_details=row['wish_details'],
            created_at=make_aware_if_needed(row['created_at'])
        )

    # 8. RESTORE REPORTS (Safely handling JSON conversion)
    print("... Migrating Reports")
    rep_data = fetch_all_from_sqlite('finance_management_reports')
    for row in rep_data:
        report_payload = row['data']
        
        # CRITICAL: Convert dict to string before saving to Encrypted Field
        if not isinstance(report_payload, str):
            report_payload = json.dumps(report_payload)
            
        Reports.objects.create(
            id=row['id'],
            user_id=row['user_id'],
            month=row['month'],
            year=row['year'],
            data=report_payload, 
            created_at=make_aware_if_needed(row['created_at'])
        )

    print("✅ Restoration Complete! All data is now encrypted in MySQL.")

if __name__ == '__main__':
    run_migration()
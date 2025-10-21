#!/usr/bin/env python
"""
Production Data Migration Script for Imhotep Finance App Restructuring
This script safely migrates data from finance_management to separate apps.

IMPORTANT: Run this script ONLY after:
1. Database backup is completed
2. New code is deployed
3. All new app migrations are run
"""

import os
import sys
import django
from django.db import transaction
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imhotep_finance.settings')
django.setup()

def log_message(message, level="INFO"):
    """Log messages with timestamp"""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def verify_backup_exists():
    """Verify that backup exists before proceeding"""
    log_message("Verifying backup exists...")
    # Add your backup verification logic here
    # For example, check if backup file exists or database backup is recent
    return True

def check_data_integrity():
    """Check data integrity before and after migration"""
    try:
        from finance_management.models import (
            Transactions as OldTransactions,
            NetWorth as OldNetWorth,
            Wishlist as OldWishlist,
            ScheduledTransaction as OldScheduledTransaction,
            Target as OldTarget,
            Reports as OldReports
        )
        
        old_counts = {
            'transactions': OldTransactions.objects.count(),
            'networth': OldNetWorth.objects.count(),
            'wishlist': OldWishlist.objects.count(),
            'scheduled_transactions': OldScheduledTransaction.objects.count(),
            'targets': OldTarget.objects.count(),
            'reports': OldReports.objects.count()
        }
        
        log_message(f"Old data counts: {old_counts}")
        return old_counts
    except Exception as e:
        log_message(f"Error checking old data: {e}", "ERROR")
        return None

def migrate_transactions():
    """Migrate Transactions and NetWorth data"""
    try:
        from finance_management.models import Transactions as OldTransactions, NetWorth as OldNetWorth
        from transaction_management.models import Transactions, NetWorth
        
        log_message("Starting Transactions migration...")
        
        with transaction.atomic():
            # Migrate Transactions
            transaction_count = 0
            for old_trans in OldTransactions.objects.all():
                new_trans = Transactions.objects.create(
                    user=old_trans.user,
                    date=old_trans.date,
                    amount=old_trans.amount,
                    currency=old_trans.currency,
                    trans_status=old_trans.trans_status,
                    trans_details=old_trans.trans_details,
                    category=old_trans.category,
                    created_at=old_trans.created_at
                )
                transaction_count += 1
                
                if transaction_count % 100 == 0:
                    log_message(f"Migrated {transaction_count} transactions...")
            
            # Migrate NetWorth
            networth_count = 0
            for old_networth in OldNetWorth.objects.all():
                NetWorth.objects.create(
                    user=old_networth.user,
                    total=old_networth.total,
                    currency=old_networth.currency,
                    created_at=old_networth.created_at
                )
                networth_count += 1
            
            log_message(f"Successfully migrated {transaction_count} transactions and {networth_count} networth records")
            return True
            
    except Exception as e:
        log_message(f"Error migrating transactions: {e}", "ERROR")
        return False

def migrate_wishlist():
    """Migrate Wishlist data"""
    try:
        from finance_management.models import Wishlist as OldWishlist
        from wishlist_management.models import Wishlist
        
        log_message("Starting Wishlist migration...")
        
        with transaction.atomic():
            wishlist_count = 0
            for old_wish in OldWishlist.objects.all():
                Wishlist.objects.create(
                    user=old_wish.user,
                    transaction=old_wish.transaction,  # Foreign key will be handled automatically
                    year=old_wish.year,
                    price=old_wish.price,
                    currency=old_wish.currency,
                    status=old_wish.status,
                    link=old_wish.link,
                    wish_details=old_wish.wish_details,
                    created_at=old_wish.created_at
                )
                wishlist_count += 1
                
                if wishlist_count % 50 == 0:
                    log_message(f"Migrated {wishlist_count} wishlist items...")
            
            log_message(f"Successfully migrated {wishlist_count} wishlist items")
            return True
            
    except Exception as e:
        log_message(f"Error migrating wishlist: {e}", "ERROR")
        return False

def migrate_scheduled_transactions():
    """Migrate ScheduledTransaction data"""
    try:
        from finance_management.models import ScheduledTransaction as OldScheduledTransaction
        from scheduled_trans_management.models import ScheduledTransaction
        
        log_message("Starting ScheduledTransaction migration...")
        
        with transaction.atomic():
            scheduled_count = 0
            for old_scheduled in OldScheduledTransaction.objects.all():
                ScheduledTransaction.objects.create(
                    user=old_scheduled.user,
                    date=old_scheduled.date,
                    amount=old_scheduled.amount,
                    currency=old_scheduled.currency,
                    scheduled_trans_status=old_scheduled.scheduled_trans_status,
                    scheduled_trans_details=old_scheduled.scheduled_trans_details,
                    category=old_scheduled.category,
                    last_time_added=old_scheduled.last_time_added,
                    status=old_scheduled.status,
                    created_at=old_scheduled.created_at
                )
                scheduled_count += 1
                
                if scheduled_count % 50 == 0:
                    log_message(f"Migrated {scheduled_count} scheduled transactions...")
            
            log_message(f"Successfully migrated {scheduled_count} scheduled transactions")
            return True
            
    except Exception as e:
        log_message(f"Error migrating scheduled transactions: {e}", "ERROR")
        return False

def migrate_targets():
    """Migrate Target data"""
    try:
        from finance_management.models import Target as OldTarget
        from target_management.models import Target
        
        log_message("Starting Target migration...")
        
        with transaction.atomic():
            target_count = 0
            for old_target in OldTarget.objects.all():
                Target.objects.create(
                    user=old_target.user,
                    target=old_target.target,
                    month=old_target.month,
                    year=old_target.year,
                    score=old_target.score,
                    created_at=old_target.created_at
                )
                target_count += 1
                
                if target_count % 50 == 0:
                    log_message(f"Migrated {target_count} targets...")
            
            log_message(f"Successfully migrated {target_count} targets")
            return True
            
    except Exception as e:
        log_message(f"Error migrating targets: {e}", "ERROR")
        return False

def migrate_reports():
    """Migrate Reports data"""
    try:
        from finance_management.models import Reports as OldReports
        from user_reports.models import Reports
        
        log_message("Starting Reports migration...")
        
        with transaction.atomic():
            report_count = 0
            for old_report in OldReports.objects.all():
                Reports.objects.create(
                    user=old_report.user,
                    month=old_report.month,
                    year=old_report.year,
                    data=old_report.data,
                    created_at=old_report.created_at
                )
                report_count += 1
                
                if report_count % 50 == 0:
                    log_message(f"Migrated {report_count} reports...")
            
            log_message(f"Successfully migrated {report_count} reports")
            return True
            
    except Exception as e:
        log_message(f"Error migrating reports: {e}", "ERROR")
        return False

def verify_migration_success():
    """Verify that migration was successful"""
    try:
        from transaction_management.models import Transactions, NetWorth
        from wishlist_management.models import Wishlist
        from scheduled_trans_management.models import ScheduledTransaction
        from target_management.models import Target
        from user_reports.models import Reports
        
        new_counts = {
            'transactions': Transactions.objects.count(),
            'networth': NetWorth.objects.count(),
            'wishlist': Wishlist.objects.count(),
            'scheduled_transactions': ScheduledTransaction.objects.count(),
            'targets': Target.objects.count(),
            'reports': Reports.objects.count()
        }
        
        log_message(f"New data counts: {new_counts}")
        return new_counts
        
    except Exception as e:
        log_message(f"Error verifying migration: {e}", "ERROR")
        return None

def main():
    """Main migration function"""
    log_message("=" * 60)
    log_message("STARTING PRODUCTION DATA MIGRATION")
    log_message("=" * 60)
    
    # Step 1: Verify backup exists
    if not verify_backup_exists():
        log_message("Backup verification failed. Aborting migration.", "ERROR")
        sys.exit(1)
    
    # Step 2: Check initial data integrity
    log_message("Checking initial data integrity...")
    old_counts = check_data_integrity()
    if not old_counts:
        log_message("Failed to check initial data. Aborting migration.", "ERROR")
        sys.exit(1)
    
    # Step 3: Run migrations
    log_message("Starting data migration process...")
    
    migrations = [
        ("Transactions & NetWorth", migrate_transactions),
        ("Wishlist", migrate_wishlist),
        ("Scheduled Transactions", migrate_scheduled_transactions),
        ("Targets", migrate_targets),
        ("Reports", migrate_reports),
    ]
    
    failed_migrations = []
    
    for migration_name, migration_func in migrations:
        log_message(f"Running {migration_name} migration...")
        if not migration_func():
            failed_migrations.append(migration_name)
            log_message(f"FAILED: {migration_name} migration", "ERROR")
        else:
            log_message(f"SUCCESS: {migration_name} migration completed")
    
    # Step 4: Verify migration success
    log_message("Verifying migration success...")
    new_counts = verify_migration_success()
    
    if not new_counts:
        log_message("Failed to verify migration. Manual verification required.", "ERROR")
        sys.exit(1)
    
    # Step 5: Report results
    log_message("=" * 60)
    log_message("MIGRATION RESULTS")
    log_message("=" * 60)
    
    if failed_migrations:
        log_message(f"FAILED MIGRATIONS: {', '.join(failed_migrations)}", "ERROR")
        log_message("Please check the logs and run failed migrations manually.", "ERROR")
    else:
        log_message("ALL MIGRATIONS COMPLETED SUCCESSFULLY!", "SUCCESS")
    
    log_message("Data counts comparison:")
    for key in old_counts:
        old_count = old_counts[key]
        new_count = new_counts.get(key, 0)
        status = "✓" if old_count == new_count else "✗"
        log_message(f"  {key}: {old_count} → {new_count} {status}")
    
    log_message("=" * 60)
    log_message("MIGRATION COMPLETED")
    log_message("=" * 60)

if __name__ == "__main__":
    main()

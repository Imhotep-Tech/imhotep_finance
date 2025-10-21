#!/usr/bin/env python
"""
Migration Verification Script
This script verifies that the data migration was successful.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imhotep_finance.settings')
django.setup()

def verify_migration():
    """Verify that the migration was successful"""
    print("=" * 60)
    print("MIGRATION VERIFICATION")
    print("=" * 60)
    
    try:
        # Import old models
        from finance_management.models import (
            Transactions as OldTransactions,
            NetWorth as OldNetWorth,
            Wishlist as OldWishlist,
            ScheduledTransaction as OldScheduledTransaction,
            Target as OldTarget,
            Reports as OldReports
        )
        
        # Import new models
        from transaction_management.models import Transactions, NetWorth
        from wishlist_management.models import Wishlist
        from scheduled_trans_management.models import ScheduledTransaction
        from target_management.models import Target
        from user_reports.models import Reports
        
        # Get counts
        old_counts = {
            'Transactions': OldTransactions.objects.count(),
            'NetWorth': OldNetWorth.objects.count(),
            'Wishlist': OldWishlist.objects.count(),
            'ScheduledTransaction': OldScheduledTransaction.objects.count(),
            'Target': OldTarget.objects.count(),
            'Reports': OldReports.objects.count()
        }
        
        new_counts = {
            'Transactions': Transactions.objects.count(),
            'NetWorth': NetWorth.objects.count(),
            'Wishlist': Wishlist.objects.count(),
            'ScheduledTransaction': ScheduledTransaction.objects.count(),
            'Target': Target.objects.count(),
            'Reports': Reports.objects.count()
        }
        
        print("Data Count Comparison:")
        print("-" * 40)
        
        all_match = True
        for model_name in old_counts:
            old_count = old_counts[model_name]
            new_count = new_counts[model_name]
            status = "✓" if old_count == new_count else "✗"
            
            if old_count != new_count:
                all_match = False
            
            print(f"{model_name:20} | {old_count:6} → {new_count:6} {status}")
        
        print("-" * 40)
        
        if all_match:
            print("✅ ALL DATA MIGRATED SUCCESSFULLY!")
            print("✅ All counts match between old and new models")
        else:
            print("❌ DATA MIGRATION ISSUES DETECTED!")
            print("❌ Some counts do not match")
            return False
        
        # Test sample data integrity
        print("\nTesting sample data integrity...")
        
        # Test Transactions
        if old_counts['Transactions'] > 0:
            old_trans = OldTransactions.objects.first()
            new_trans = Transactions.objects.filter(
                user=old_trans.user,
                amount=old_trans.amount,
                currency=old_trans.currency,
                trans_status=old_trans.trans_status
            ).first()
            
            if new_trans:
                print("✅ Sample transaction data integrity verified")
            else:
                print("❌ Sample transaction data integrity failed")
                return False
        
        # Test NetWorth
        if old_counts['NetWorth'] > 0:
            old_networth = OldNetWorth.objects.first()
            new_networth = NetWorth.objects.filter(
                user=old_networth.user,
                total=old_networth.total,
                currency=old_networth.currency
            ).first()
            
            if new_networth:
                print("✅ Sample networth data integrity verified")
            else:
                print("❌ Sample networth data integrity failed")
                return False
        
        print("\n" + "=" * 60)
        print("MIGRATION VERIFICATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False

if __name__ == "__main__":
    success = verify_migration()
    sys.exit(0 if success else 1)

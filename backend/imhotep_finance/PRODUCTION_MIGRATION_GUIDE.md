# 🚀 Production Migration Guide - Imhotep Finance App Restructuring

This guide provides step-by-step instructions for safely migrating your production data from the monolithic `finance_management` app to the new modular structure.

## 📋 Prerequisites

- ✅ Database backup completed
- ✅ New code deployed to production
- ✅ Virtual environment activated
- ✅ Database credentials configured
- ✅ Sufficient disk space for backups

## 🔧 Step-by-Step Production Migration

### Step 1: Pre-Migration Setup

```bash
# 1. Navigate to your project directory
cd /path/to/your/imhotep_finance/backend/imhotep_finance

# 2. Activate virtual environment
source venv/bin/activate  # or your virtual environment activation command

# 3. Make scripts executable
chmod +x deploy_production.sh
chmod +x rollback_production.sh
chmod +x migrate_production_data.py

# 4. Verify environment
python manage.py check
```

### Step 2: Run the Production Deployment Script

```bash
# Run the automated deployment script
./deploy_production.sh
```

**What this script does:**
1. ✅ Creates final database backup
2. ✅ Runs migrations for new apps only
3. ✅ Executes data migration script
4. ✅ Verifies data integrity
5. ✅ Reports success/failure status

### Step 3: Manual Verification (Recommended)

After the script completes, manually verify the migration:

```bash
# Check data counts
python manage.py shell -c "
from transaction_management.models import Transactions
from finance_management.models import Transactions as OldTransactions
from wishlist_management.models import Wishlist
from finance_management.models import Wishlist as OldWishlist

print('=== DATA VERIFICATION ===')
print(f'Old Transactions: {OldTransactions.objects.count()}')
print(f'New Transactions: {Transactions.objects.count()}')
print(f'Old Wishlist: {OldWishlist.objects.count()}')
print(f'New Wishlist: {Wishlist.objects.count()}')
"

# Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/transactions/transaction/get-transactions/
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/wishlist/wishlist/get-wishlist/
```

### Step 4: Post-Migration Cleanup (Optional)

**⚠️ Only run this after confirming everything works perfectly:**

```bash
# 1. Create migration to remove old models
python manage.py makemigrations finance_management

# 2. Apply the cleanup migration
python manage.py migrate finance_management

# 3. Remove old model code from finance_management/models.py
# (Keep only the comment about models being moved)
```

## 🛡️ Safety Measures

### Backup Strategy
- **Before migration**: Full database backup
- **During migration**: Additional backup before data migration
- **After migration**: Current state backup before any cleanup

### Rollback Plan
If issues are detected:

```bash
# Run the rollback script
./rollback_production.sh
```

This will:
1. List available backups
2. Let you select which backup to restore
3. Create current backup before rollback
4. Restore the selected backup
5. Verify the rollback

## 📊 Monitoring & Verification

### Data Integrity Checks
```bash
# Check all data counts match
python manage.py shell -c "
from finance_management.models import *
from transaction_management.models import *
from wishlist_management.models import *
from scheduled_trans_management.models import *
from target_management.models import *
from user_reports.models import *

print('=== COMPREHENSIVE DATA CHECK ===')
print(f'Old Transactions: {Transactions.objects.count()}')
print(f'New Transactions: {Transactions.objects.count()}')
print(f'Old NetWorth: {NetWorth.objects.count()}')
print(f'New NetWorth: {NetWorth.objects.count()}')
print(f'Old Wishlist: {Wishlist.objects.count()}')
print(f'New Wishlist: {Wishlist.objects.count()}')
print(f'Old Scheduled: {ScheduledTransaction.objects.count()}')
print(f'New Scheduled: {ScheduledTransaction.objects.count()}')
print(f'Old Targets: {Target.objects.count()}')
print(f'New Targets: {Target.objects.count()}')
print(f'Old Reports: {Reports.objects.count()}')
print(f'New Reports: {Reports.objects.count()}')
"
```

### API Endpoint Testing
```bash
# Test all new endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/transactions/transaction/get-transactions/
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/wishlist/wishlist/get-wishlist/
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/scheduled-transactions/scheduled-trans/get-scheduled-trans/
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/targets/target/get-target/
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/reports/get-monthly-report/
```

## 🚨 Troubleshooting

### Common Issues

1. **Migration fails with foreign key errors**
   ```bash
   # Check if all apps are properly installed
   python manage.py check
   
   # Verify all migrations are applied
   python manage.py showmigrations
   ```

2. **Data count mismatch**
   ```bash
   # Run the verification script again
   python migrate_production_data.py
   ```

3. **API endpoints not working**
   ```bash
   # Check URL configuration
   python manage.py check --deploy
   
   # Verify all apps are in INSTALLED_APPS
   python manage.py shell -c "from django.conf import settings; print(settings.INSTALLED_APPS)"
   ```

### Emergency Rollback
```bash
# If everything goes wrong, restore from backup
./rollback_production.sh
```

## 📈 Success Criteria

✅ **Migration is successful when:**
- All data counts match between old and new models
- All API endpoints respond correctly
- No errors in Django system checks
- Application functions normally
- Admin panel shows all models correctly

## 📞 Support

If you encounter issues:
1. Check the logs from the deployment script
2. Verify your backup is valid
3. Run the rollback script if needed
4. Contact support with specific error messages

## 🎯 Next Steps After Successful Migration

1. **Monitor the application** for 24-48 hours
2. **Test all user workflows** thoroughly
3. **Update any external integrations** that might reference old endpoints
4. **Document the new API structure** for your team
5. **Plan the cleanup** of old model code (optional)

---

**Remember**: This migration preserves all your data while restructuring the codebase for better scalability and maintainability! 🚀

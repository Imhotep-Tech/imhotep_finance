#!/bin/bash

# Production Deployment Script for Imhotep Finance App Restructuring
# This script safely deploys the restructured app with data preservation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Configuration
PROJECT_DIR="/home/kbassem/code/imhotep_tech/imhotep_finance/backend/imhotep_finance"
BACKUP_DIR="/backups/imhotep_finance"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log "=========================================="
log "PRODUCTION DEPLOYMENT SCRIPT"
log "Imhotep Finance App Restructuring"
log "=========================================="

# Step 1: Pre-deployment checks
log "Step 1: Pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    log_error "manage.py not found. Please run this script from the Django project root."
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    log_warning "Virtual environment not detected. Make sure to activate it."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if database is accessible
log "Testing database connection..."
python manage.py check --database default
if [ $? -ne 0 ]; then
    log_error "Database connection failed. Please check your database configuration."
    exit 1
fi

log_success "Pre-deployment checks passed"

# Step 2: Create final backup
log "Step 2: Creating final backup..."

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_before_restructure_$TIMESTAMP.sql"

log "Creating database backup to $BACKUP_FILE..."
pg_dump $DATABASE_URL > "$BACKUP_FILE" 2>/dev/null || {
    log_error "Database backup failed. Please check your DATABASE_URL and permissions."
    exit 1
}

log_success "Backup created: $BACKUP_FILE"

# Step 3: Deploy new code (assuming code is already deployed)
log "Step 3: Code deployment (assuming already done)..."

# Step 4: Run migrations for new apps only
log "Step 4: Running migrations for new apps..."

log "Creating migrations for new apps..."
python manage.py makemigrations transaction_management
python manage.py makemigrations scheduled_trans_management
python manage.py makemigrations target_management
python manage.py makemigrations user_reports
python manage.py makemigrations wishlist_management

log "Applying migrations for new apps..."
python manage.py migrate transaction_management
python manage.py migrate scheduled_trans_management
python manage.py migrate target_management
python manage.py migrate user_reports
python manage.py migrate wishlist_management

log_success "New app migrations completed"

# Step 5: Run data migration
log "Step 5: Running data migration..."

log "Starting data migration script..."
python migrate_production_data.py

if [ $? -ne 0 ]; then
    log_error "Data migration failed!"
    log "Restoring from backup..."
    psql $DATABASE_URL < "$BACKUP_FILE"
    log_error "Deployment failed. Database restored from backup."
    exit 1
fi

log_success "Data migration completed successfully"

# Step 6: Verify deployment
log "Step 6: Verifying deployment..."

log "Running Django system checks..."
python manage.py check

log "Testing database integrity..."
python manage.py shell -c "
from transaction_management.models import Transactions
from finance_management.models import Transactions as OldTransactions
old_count = OldTransactions.objects.count()
new_count = Transactions.objects.count()
print(f'Old transactions: {old_count}')
print(f'New transactions: {new_count}')
if old_count != new_count:
    print('WARNING: Transaction count mismatch!')
    exit(1)
else:
    print('Transaction count verification passed')
"

if [ $? -ne 0 ]; then
    log_error "Data verification failed!"
    exit 1
fi

log_success "Deployment verification passed"

# Step 7: Optional cleanup (commented out for safety)
log "Step 7: Post-deployment cleanup..."

log_warning "Old models are still present in finance_management app."
log_warning "To remove them safely, run the following after confirming everything works:"
log_warning "1. python manage.py makemigrations finance_management"
log_warning "2. python manage.py migrate finance_management"
log_warning "3. Remove old model code from finance_management/models.py"

# Step 8: Final status
log "=========================================="
log "DEPLOYMENT COMPLETED SUCCESSFULLY!"
log "=========================================="
log_success "All data has been migrated to new app structure"
log_success "Backup available at: $BACKUP_FILE"
log "Next steps:"
log "1. Test the application thoroughly"
log "2. Monitor for any issues"
log "3. After confirmation, remove old models (see warnings above)"
log "=========================================="

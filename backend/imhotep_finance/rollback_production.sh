#!/bin/bash

# Production Rollback Script for Imhotep Finance App Restructuring
# This script rolls back the deployment if issues are detected

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
BACKUP_DIR="/backups/imhotep_finance"

log "=========================================="
log "PRODUCTION ROLLBACK SCRIPT"
log "Imhotep Finance App Restructuring"
log "=========================================="

# Step 1: List available backups
log "Step 1: Available backups..."

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

log "Available backups:"
ls -la "$BACKUP_DIR"/*.sql 2>/dev/null || {
    log_error "No backup files found in $BACKUP_DIR"
    exit 1
}

# Step 2: Select backup to restore
log "Step 2: Select backup to restore..."

echo "Available backups:"
ls -la "$BACKUP_DIR"/*.sql | nl

read -p "Enter the number of the backup to restore (or press Enter for the latest): " backup_choice

if [ -z "$backup_choice" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql | head -n1)
else
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql | sed -n "${backup_choice}p")
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Selected backup file not found: $BACKUP_FILE"
    exit 1
fi

log "Selected backup: $BACKUP_FILE"

# Step 3: Confirm rollback
log_warning "This will restore the database from backup and may cause data loss!"
log_warning "Make sure you have a current backup before proceeding."

read -p "Are you sure you want to proceed with rollback? (yes/NO): " confirm
if [ "$confirm" != "yes" ]; then
    log "Rollback cancelled by user"
    exit 0
fi

# Step 4: Create current backup before rollback
log "Step 4: Creating current backup before rollback..."

CURRENT_BACKUP="$BACKUP_DIR/backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > "$CURRENT_BACKUP" 2>/dev/null || {
    log_error "Failed to create current backup. Aborting rollback."
    exit 1
}

log_success "Current backup created: $CURRENT_BACKUP"

# Step 5: Restore from backup
log "Step 5: Restoring database from backup..."

log "Restoring from: $BACKUP_FILE"
psql $DATABASE_URL < "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    log_error "Database restoration failed!"
    exit 1
fi

log_success "Database restored successfully"

# Step 6: Verify rollback
log "Step 6: Verifying rollback..."

log "Running Django system checks..."
python manage.py check

log "Testing database connection..."
python manage.py shell -c "
from finance_management.models import Transactions
count = Transactions.objects.count()
print(f'Transactions in database: {count}')
"

if [ $? -ne 0 ]; then
    log_error "Rollback verification failed!"
    exit 1
fi

log_success "Rollback verification passed"

# Step 7: Final status
log "=========================================="
log "ROLLBACK COMPLETED SUCCESSFULLY!"
log "=========================================="
log_success "Database has been restored to previous state"
log_success "Current backup available at: $CURRENT_BACKUP"
log "Next steps:"
log "1. Investigate the issues that caused the rollback"
log "2. Fix the problems"
log "3. Re-run the deployment when ready"
log "=========================================="

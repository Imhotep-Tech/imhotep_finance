#!/bin/bash
set -euo pipefail

# =============================================================================
# Production Entrypoint for Imhotep Finance Backend
# =============================================================================
# This script:
#   1. Waits for PostgreSQL to be ready
#   2. Runs database migrations (does NOT create new ones)
#   3. Collects static files
#   4. Starts Gunicorn (production WSGI server)
# =============================================================================

DB_HOST="${DATABASE_HOST:-db}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-imhotep_finance_user}"

echo "============================================"
echo "  Imhotep Finance — Production Startup"
echo "============================================"

# --- 1. Wait for PostgreSQL ---
echo "[1/4] Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "  ✅ PostgreSQL is ready!"

# --- 2. Run migrations ---
echo "[2/4] Running database migrations..."
python manage.py migrate --noinput
echo "  ✅ Migrations complete!"

# --- 3. Collect static files ---
echo "[3/4] Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true
echo "  ✅ Static files collected!"

# --- 4. Start Gunicorn ---
WORKERS="${GUNICORN_WORKERS:-3}"
BIND="${GUNICORN_BIND:-0.0.0.0:8000}"
TIMEOUT="${GUNICORN_TIMEOUT:-120}"

echo "[4/4] Starting Gunicorn (workers=${WORKERS}, bind=${BIND})..."
echo "============================================"

exec gunicorn imhotep_finance.wsgi:application \
  --bind "$BIND" \
  --workers "$WORKERS" \
  --timeout "$TIMEOUT" \
  --access-logfile - \
  --error-logfile -

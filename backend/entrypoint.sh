#!/bin/bash
set -euo pipefail

DB_HOST="${DATABASE_HOST:-db}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-imhotep_finance_db}"
DB_USER="${DATABASE_USER:-imhotep_finance_user}"
DB_PASS="${DATABASE_PASSWORD:-imhotep_finance_password}"

export PGPASSWORD="$DB_PASS"

echo "Waiting for Postgres at $DB_HOST:$DB_PORT (db=$DB_NAME, user=$DB_USER)..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "Database is ready!"

echo "Checking for migration conflicts..."
if python manage.py migrate --check 2>&1 | grep -q "InconsistentMigrationHistory"; then
  echo "Migration conflicts detected. Resetting database schema..."
  python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('DROP SCHEMA public CASCADE;')
cursor.execute('CREATE SCHEMA public;')
cursor.execute('GRANT ALL ON SCHEMA public TO postgres;')
cursor.execute('GRANT ALL ON SCHEMA public TO public;')
print('Database schema reset')
"
fi

echo "Running database migrations..."
python manage.py makemigrations accounts
python manage.py makemigrations finance_management
python manage.py makemigrations
python manage.py migrate

echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

python manage.py runserver 0.0.0.0:8000
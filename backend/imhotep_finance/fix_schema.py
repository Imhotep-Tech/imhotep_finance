import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imhotep_finance.settings')
django.setup()

def fix_schema():
    print("🔧 Fixing Database Schema...")
    with connection.cursor() as cursor:
        # 1. Delete the table with the wrong column type
        print("... Dropping broken table 'finance_management_reports'")
        cursor.execute("DROP TABLE IF EXISTS finance_management_reports;")
        
        # 2. Delete the migration history so Django thinks it needs to install it again
        print("... resetting migration history for 'user_reports'")
        cursor.execute("DELETE FROM django_migrations WHERE app='user_reports';")
    
    print("✅ Cleaned. You can now run 'migrate'.")

if __name__ == '__main__':
    fix_schema()
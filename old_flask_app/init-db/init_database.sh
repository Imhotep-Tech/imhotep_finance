#!/bin/bash

# Imhotep Finance Database Initialization Script
# This script sets up the database schema for the Imhotep Finance application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "=== Imhotep Finance Database Initialization ===" "$BLUE"
print_message "This script will create the database schema for Imhotep Finance" "$YELLOW"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    print_message "ERROR: DATABASE_URL environment variable is not set!" "$RED"
    print_message "Please set DATABASE_URL in your .env file or environment" "$YELLOW"
    print_message "Example: DATABASE_URL=sqlite:///imhotep_finance.db" "$YELLOW"
    exit 1
fi

print_message "Database URL: $DATABASE_URL" "$BLUE"

# Extract database type from URL
if [[ $DATABASE_URL == sqlite* ]]; then
    DB_TYPE="sqlite"
    # Extract database file path from sqlite URL
    DB_FILE=$(echo $DATABASE_URL | sed 's/sqlite:\/\/\///g')
elif [[ $DATABASE_URL == postgresql* ]]; then
    DB_TYPE="postgresql"
elif [[ $DATABASE_URL == mysql* ]]; then
    DB_TYPE="mysql"
else
    print_message "WARNING: Unknown database type in DATABASE_URL" "$YELLOW"
    DB_TYPE="unknown"
fi

print_message "Detected database type: $DB_TYPE" "$BLUE"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Function to execute SQL file
execute_sql_file() {
    local file_path="$1"
    local description="$2"
    
    print_message "Executing: $description" "$YELLOW"
    
    case $DB_TYPE in
        "sqlite")
            if [ ! -f "$DB_FILE" ]; then
                print_message "Creating SQLite database file: $DB_FILE" "$BLUE"
                touch "$DB_FILE"
            fi
            sqlite3 "$DB_FILE" < "$file_path"
            ;;
        "postgresql")
            psql "$DATABASE_URL" < "$file_path"
            ;;
        "mysql")
            mysql --defaults-extra-file=<(printf "[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n" "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT") "$DB_NAME" < "$file_path"
            ;;
        *)
            print_message "ERROR: Unsupported database type: $DB_TYPE" "$RED"
            print_message "Please execute the SQL files manually:" "$YELLOW"
            print_message "1. $file_path" "$YELLOW"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_message "✓ Successfully executed: $description" "$GREEN"
    else
        print_message "✗ Failed to execute: $description" "$RED"
        return 1
    fi
}

# Create database schema
print_message "\n--- Step 1: Creating Database Schema ---" "$BLUE"
execute_sql_file "$SCRIPT_DIR/01_create_schema.sql" "Database schema creation"

if [ $? -ne 0 ]; then
    print_message "ERROR: Failed to create database schema!" "$RED"
    exit 1
fi

# Add constraints and validations
print_message "\n--- Step 2: Adding Constraints and Validations ---" "$BLUE"
execute_sql_file "$SCRIPT_DIR/02_constraints_validation.sql" "Constraints and validations"

if [ $? -ne 0 ]; then
    print_message "WARNING: Some constraints may have failed to apply" "$YELLOW"
    print_message "This is normal if the database doesn't support all constraint types" "$YELLOW"
fi

# Database-specific optimizations
case $DB_TYPE in
    "sqlite")
        print_message "\n--- Step 3: SQLite-specific optimizations ---" "$BLUE"
        if [ -f "$DB_FILE" ]; then
            sqlite3 "$DB_FILE" "PRAGMA foreign_keys = ON;"
            sqlite3 "$DB_FILE" "PRAGMA journal_mode = WAL;"
            sqlite3 "$DB_FILE" "PRAGMA synchronous = NORMAL;"
            sqlite3 "$DB_FILE" "PRAGMA cache_size = 1000;"
            sqlite3 "$DB_FILE" "PRAGMA temp_store = memory;"
            print_message "✓ SQLite optimizations applied" "$GREEN"
        fi
        ;;
    "postgresql")
        print_message "\n--- Step 3: PostgreSQL-specific optimizations ---" "$BLUE"
        print_message "No additional PostgreSQL optimizations needed" "$GREEN"
        ;;
    "mysql")
        print_message "\n--- Step 3: MySQL-specific optimizations ---" "$BLUE"
        print_message "No additional MySQL optimizations needed" "$GREEN"
        ;;
esac

# Verify database structure
print_message "\n--- Step 4: Verifying Database Structure ---" "$BLUE"

case $DB_TYPE in
    "sqlite")
        if [ -f "$DB_FILE" ]; then
            TABLES=$(sqlite3 "$DB_FILE" ".tables")
            print_message "Created tables: $TABLES" "$GREEN"
            
            # Count tables
            TABLE_COUNT=$(echo $TABLES | wc -w)
            if [ $TABLE_COUNT -ge 7 ]; then
                print_message "✓ All expected tables created successfully" "$GREEN"
            else
                print_message "⚠ Expected at least 7 tables, found $TABLE_COUNT" "$YELLOW"
            fi
        fi
        ;;
    "postgresql")
        print_message "Please verify tables manually with: \\dt" "$YELLOW"
        ;;
    "mysql")
        print_message "Please verify tables manually with: SHOW TABLES;" "$YELLOW"
        ;;
esac

# Summary
print_message "\n=== Database Initialization Complete ===" "$GREEN"
print_message "The following components have been set up:" "$BLUE"
print_message "• Users table (authentication and preferences)" "$GREEN"
print_message "• Transactions table (financial transactions)" "$GREEN"
print_message "• Networth table (user balances by currency)" "$GREEN"
print_message "• Wishlist table (savings goals and purchases)" "$GREEN"
print_message "• Scheduled transactions table (recurring transactions)" "$GREEN"
print_message "• Targets table (monthly savings goals)" "$GREEN"
print_message "• Trash tables (soft deletion support)" "$GREEN"
print_message "• Indexes and constraints for data integrity" "$GREEN"

print_message "\nNext steps:" "$YELLOW"
print_message "1. Start your Flask application" "$YELLOW"
print_message "2. Register a new user account" "$YELLOW"
print_message "3. Begin tracking your finances!" "$YELLOW"

case $DB_TYPE in
    "sqlite")
        print_message "\nDatabase file location: $DB_FILE" "$BLUE"
        print_message "Make sure to backup this file regularly!" "$YELLOW"
        ;;
    *)
        print_message "\nRemember to configure regular database backups!" "$YELLOW"
        ;;
esac

print_message "\n🎉 Database setup completed successfully! 🎉" "$GREEN"

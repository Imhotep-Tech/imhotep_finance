# Imhotep Finance Database Initialization

This folder contains the database schema and initialization scripts for the Imhotep Finance application.

## Files Overview

- **`01_create_schema.sql`** - Main database schema with all tables, indexes, and triggers
- **`02_constraints_validation.sql`** - Additional constraints and validation rules
- **`init_database.sh`** - Automated database setup script
- **`README.md`** - This documentation file

## Quick Start

### Prerequisites

1. Ensure you have the required database client installed:
   - **SQLite**: `sqlite3` command-line tool
   - **PostgreSQL**: `psql` client
   - **MySQL**: `mysql` client

2. Set up your environment variables:
   ```bash
   # For SQLite (recommended for development)
   export DATABASE_URL="sqlite:///imhotep_finance.db"
   
   # For PostgreSQL
   export DATABASE_URL="postgresql://username:password@localhost:5432/imhotep_finance"
   
   # For MySQL
   export DATABASE_URL="mysql://username:password@localhost:3306/imhotep_finance"
   ```

### Automatic Setup (Recommended)

Run the initialization script:

```bash
cd init-db
./init_database.sh
```

The script will:
- Detect your database type from the `DATABASE_URL`
- Create all necessary tables
- Apply constraints and indexes
- Optimize database settings
- Verify the setup

### Manual Setup

If you prefer to set up the database manually:

1. **Create the main schema:**
   ```bash
   # For SQLite
   sqlite3 your_database.db < 01_create_schema.sql
   
   # For PostgreSQL
   psql $DATABASE_URL < 01_create_schema.sql
   
   # For MySQL
   mysql -u username -p database_name < 01_create_schema.sql
   ```

2. **Apply constraints (optional but recommended):**
   ```bash
   # For SQLite
   sqlite3 your_database.db < 02_constraints_validation.sql
   
   # For PostgreSQL
   psql $DATABASE_URL < 02_constraints_validation.sql
   
   # For MySQL
   mysql -u username -p database_name < 02_constraints_validation.sql
   ```

## Database Schema Overview

The Imhotep Finance application uses the following main tables:

### Core Tables

1. **`users`** - User accounts and authentication
   - Stores usernames, emails, passwords, and preferences
   - Supports email verification and profile pictures
   - Default favorite currency setting

2. **`trans`** - Financial transactions
   - Records all deposits and withdrawals
   - Multi-currency support
   - Transaction categorization
   - Links to external sources

3. **`networth`** - User balances by currency
   - Tracks current balance for each currency
   - Automatically updated by transactions
   - Optimized for quick balance lookups

4. **`wishlist`** - Savings goals and purchases
   - User's financial goals and wish items
   - Purchase tracking with transaction linking
   - Annual organization

5. **`scheduled_trans`** - Recurring transactions
   - Automated monthly transactions
   - Salary, bills, and regular expenses
   - Flexible scheduling system

6. **`target`** - Monthly savings goals
   - User-defined monthly targets
   - Progress tracking
   - Historical goal management

### Supporting Tables

7. **`trash_trans`** - Deleted transactions (soft delete)
8. **`trash_wishlist`** - Deleted wishlist items (soft delete)

## Features

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints validate data ranges and formats
- Unique constraints prevent duplicate records
- Indexes optimize query performance

### Multi-Currency Support
- Supports 150+ international currencies
- Currency validation ensures only valid codes
- Flexible favorite currency selection per user

### Security Features
- Password hashing (handled by application)
- Email verification system
- User data isolation
- Secure session management

### Performance Optimizations
- Strategic indexes on frequently queried columns
- Composite indexes for complex queries
- Database-specific optimizations
- Efficient pagination support

## Supported Databases

The schema is designed to work with:

- **SQLite** (recommended for development)
- **PostgreSQL** (recommended for production)
- **MySQL/MariaDB** (supported)

## Data Types and Precision

- **Financial amounts**: `DECIMAL(15,2)` for accurate calculations
- **Currency codes**: `VARCHAR(3)` for ISO currency codes
- **Dates**: `DATE` for transaction dates, `TIMESTAMP` for creation times
- **Text fields**: Appropriate `VARCHAR` and `TEXT` sizes

## Common Operations

### Adding Sample Data

To add test data for development:

```sql
-- Create a test user
INSERT INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency) 
VALUES (1, 'testuser', 'hashed_password_here', 'test@example.com', 'verified', 'USD');

-- Add initial balance
INSERT INTO networth (networth_id, user_id, currency, total) 
VALUES (1, 1, 'USD', 1000.00);
```

### Backing Up Data

```bash
# SQLite backup
cp your_database.db backup_$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# MySQL backup
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

### Checking Data Integrity

Use the built-in views:

```sql
-- Check overall data consistency
SELECT * FROM data_integrity_check;

-- View user summary statistics
SELECT * FROM user_summary WHERE user_id = 1;
```

## Troubleshooting

### Common Issues

1. **"Table already exists" errors**
   - The schema uses `CREATE TABLE IF NOT EXISTS` to prevent this
   - Safe to re-run the schema creation

2. **Foreign key constraint failures**
   - Ensure SQLite has foreign keys enabled: `PRAGMA foreign_keys = ON;`
   - Check that referenced records exist before inserting

3. **Currency validation errors**
   - Use only supported 3-letter currency codes (USD, EUR, etc.)
   - Check the constraint list in `02_constraints_validation.sql`

4. **Decimal precision issues**
   - All financial amounts use `DECIMAL(15,2)` for accuracy
   - Avoid using `FLOAT` or `REAL` for money calculations

### Migration Notes

If upgrading from an older version:

1. Always backup your data first
2. Review the schema changes in the SQL files
3. Test on a copy of your database
4. Consider data migration scripts if needed

## Development Notes

### Adding New Tables

When adding new tables:

1. Add the table definition to `01_create_schema.sql`
2. Add appropriate constraints to `02_constraints_validation.sql`
3. Create necessary indexes for performance
4. Update this README with the new table information

### Modifying Existing Tables

For schema changes:

1. Create migration scripts rather than modifying the base schema
2. Always consider backward compatibility
3. Test thoroughly with existing data
4. Document the changes

## Support

For issues related to the database schema:

1. Check the application logs for specific error messages
2. Verify your `DATABASE_URL` is correctly formatted
3. Ensure database permissions are properly set
4. Review the troubleshooting section above

The schema is designed to be robust and handle the financial data requirements of the Imhotep Finance application while maintaining data integrity and performance.

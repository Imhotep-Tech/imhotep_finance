#!/usr/bin/env python3
"""
Imhotep Finance Database Initialization Script

This script initializes the database schema for the Imhotep Finance application.
It can be run standalone or imported as a module.

Usage:
    python init_database.py
    
Or import and use:
    from init_db.init_database import initialize_database
    initialize_database()
"""

import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add parent directory to path to import from the main app
sys.path.append(str(Path(__file__).parent.parent))

def setup_logging():
    """Set up logging for the initialization process."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

def read_sql_file(file_path):
    """Read and return the contents of an SQL file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"SQL file not found: {file_path}")
    except Exception as e:
        raise Exception(f"Error reading SQL file {file_path}: {str(e)}")

def execute_sql_statements(engine, sql_content, description):
    """Execute SQL statements with proper error handling."""
    logger = logging.getLogger(__name__)
    
    # Split SQL content into individual statements
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    successful_statements = 0
    failed_statements = 0
    
    with engine.connect() as connection:
        for i, statement in enumerate(statements, 1):
            try:
                # Skip empty statements and comments
                if not statement or statement.startswith('--'):
                    continue
                
                logger.debug(f"Executing statement {i}/{len(statements)}")
                connection.execute(text(statement))
                connection.commit()
                successful_statements += 1
                
            except SQLAlchemyError as e:
                failed_statements += 1
                # Some constraints might fail if they already exist - this is often OK
                if any(keyword in str(e).lower() for keyword in ['already exists', 'duplicate', 'constraint']):
                    logger.debug(f"Skipping existing constraint/table: {str(e)[:100]}...")
                else:
                    logger.warning(f"Failed to execute statement: {str(e)[:200]}...")
                    
            except Exception as e:
                failed_statements += 1
                logger.error(f"Unexpected error executing statement: {str(e)[:200]}...")
    
    logger.info(f"{description}: {successful_statements} successful, {failed_statements} failed/skipped")
    return successful_statements, failed_statements

def check_database_connection(database_url):
    """Test the database connection."""
    logger = logging.getLogger(__name__)
    
    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            # Test with a simple query
            if 'sqlite' in database_url.lower():
                result = connection.execute(text("SELECT sqlite_version()"))
                version = result.fetchone()[0]
                logger.info(f"Connected to SQLite version: {version}")
            elif 'postgresql' in database_url.lower():
                result = connection.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                logger.info(f"Connected to PostgreSQL: {version[:50]}...")
            elif 'mysql' in database_url.lower():
                result = connection.execute(text("SELECT @@version"))
                version = result.fetchone()[0]
                logger.info(f"Connected to MySQL version: {version}")
            else:
                logger.info("Connected to database (unknown type)")
                
        return engine
        
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise

def verify_schema(engine):
    """Verify that the schema was created successfully."""
    logger = logging.getLogger(__name__)
    
    expected_tables = [
        'users', 'trans', 'networth', 'wishlist', 
        'scheduled_trans', 'target', 'trash_trans', 'trash_wishlist'
    ]
    
    try:
        with engine.connect() as connection:
            if 'sqlite' in str(engine.url).lower():
                # SQLite query to list tables
                result = connection.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                ))
            elif 'postgresql' in str(engine.url).lower():
                # PostgreSQL query to list tables
                result = connection.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
                ))
            elif 'mysql' in str(engine.url).lower():
                # MySQL query to list tables
                result = connection.execute(text("SHOW TABLES"))
            else:
                logger.warning("Cannot verify schema for unknown database type")
                return True
            
            existing_tables = [row[0] for row in result.fetchall()]
            
            missing_tables = [table for table in expected_tables if table not in existing_tables]
            extra_tables = [table for table in existing_tables if table not in expected_tables and not table.startswith('sqlite_')]
            
            logger.info(f"Found {len(existing_tables)} tables in database")
            
            if missing_tables:
                logger.warning(f"Missing expected tables: {', '.join(missing_tables)}")
            
            if extra_tables:
                logger.info(f"Additional tables found: {', '.join(extra_tables)}")
            
            # Check if core tables exist
            core_tables = ['users', 'trans', 'networth']
            if all(table in existing_tables for table in core_tables):
                logger.info("✓ Core tables verified successfully")
                return True
            else:
                logger.error("✗ Some core tables are missing")
                return False
                
    except Exception as e:
        logger.error(f"Error verifying schema: {str(e)}")
        return False

def initialize_database(database_url=None):
    """
    Initialize the Imhotep Finance database schema.
    
    Args:
        database_url (str, optional): Database URL. If not provided, will try to get from environment.
        
    Returns:
        bool: True if successful, False otherwise
    """
    logger = setup_logging()
    
    # Get database URL
    if not database_url:
        database_url = os.getenv('DATABASE_URL')
        
    if not database_url:
        logger.error("DATABASE_URL not provided and not found in environment variables")
        logger.error("Please set DATABASE_URL or pass it as a parameter")
        return False
    
    logger.info("=== Imhotep Finance Database Initialization ===")
    logger.info(f"Database URL: {database_url}")
    
    try:
        # Test database connection
        logger.info("Testing database connection...")
        engine = check_database_connection(database_url)
        
        # Get SQL file paths
        script_dir = Path(__file__).parent
        schema_file = script_dir / "01_create_schema.sql"
        constraints_file = script_dir / "02_constraints_validation.sql"
        
        if not schema_file.exists():
            logger.error(f"Schema file not found: {schema_file}")
            return False
            
        if not constraints_file.exists():
            logger.warning(f"Constraints file not found: {constraints_file}")
            constraints_file = None
        
        # Execute schema creation
        logger.info("Creating database schema...")
        schema_sql = read_sql_file(schema_file)
        success_count, fail_count = execute_sql_statements(
            engine, schema_sql, "Schema creation"
        )
        
        if success_count == 0:
            logger.error("Failed to create any schema objects")
            return False
        
        # Execute constraints (if file exists)
        if constraints_file:
            logger.info("Applying constraints and validations...")
            constraints_sql = read_sql_file(constraints_file)
            execute_sql_statements(
                engine, constraints_sql, "Constraints and validations"
            )
        
        # Verify schema
        logger.info("Verifying database schema...")
        if not verify_schema(engine):
            logger.error("Schema verification failed")
            return False
        
        # Apply database-specific optimizations
        logger.info("Applying database optimizations...")
        if 'sqlite' in database_url.lower():
            with engine.connect() as connection:
                optimizations = [
                    "PRAGMA foreign_keys = ON",
                    "PRAGMA journal_mode = WAL", 
                    "PRAGMA synchronous = NORMAL",
                    "PRAGMA cache_size = 1000",
                    "PRAGMA temp_store = memory"
                ]
                for pragma in optimizations:
                    try:
                        connection.execute(text(pragma))
                        connection.commit()
                    except Exception as e:
                        logger.debug(f"Optimization failed: {pragma} - {str(e)}")
            logger.info("✓ SQLite optimizations applied")
        
        logger.info("=== Database Initialization Complete ===")
        logger.info("The database is ready for use!")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False

def main():
    """Main function when script is run directly."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Initialize Imhotep Finance database')
    parser.add_argument('--database-url', help='Database URL (if not set in environment)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    success = initialize_database(args.database_url)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

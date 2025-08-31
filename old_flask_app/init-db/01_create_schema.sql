-- Imhotep Finance Database Schema
-- This file creates the complete database schema for the Imhotep Finance application
-- Run this script to initialize the database with all required tables

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    user_username VARCHAR(50) UNIQUE NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_mail VARCHAR(100) UNIQUE NOT NULL,
    user_mail_verify VARCHAR(20) DEFAULT 'not_verified',
    favorite_currency VARCHAR(3) DEFAULT 'USD',
    user_photo_path VARCHAR(255) DEFAULT NULL,
);

-- ============================================
-- 2. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trans (
    trans_key INTEGER PRIMARY KEY,
    trans_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    trans_status VARCHAR(10) NOT NULL CHECK (trans_status IN ('deposit', 'withdraw')),
    trans_details TEXT,
    trans_details_link TEXT,
    category VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- 3. NETWORTH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS networth (
    networth_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    total DECIMAL(15,2) DEFAULT 0.00,
    UNIQUE(user_id, currency)
);

-- ============================================
-- 4. WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
    wish_key INTEGER PRIMARY KEY,
    wish_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    link TEXT,
    wish_details TEXT,
    year INTEGER NOT NULL,
    trans_key INTEGER DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (trans_key) REFERENCES trans(trans_key) ON DELETE SET NULL
);

-- ============================================
-- 5. SCHEDULED TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_trans (
    scheduled_trans_key INTEGER PRIMARY KEY,
    scheduled_trans_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date INTEGER NOT NULL, -- Day of month (1-31)
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    scheduled_trans_status VARCHAR(10) NOT NULL CHECK (scheduled_trans_status IN ('deposit', 'withdraw')),
    scheduled_trans_details TEXT,
    scheduled_trans_link TEXT,
    category VARCHAR(100),
    last_time_added DATE DEFAULT NULL,
    status BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- 6. TARGETS/GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS target (
    target_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target DECIMAL(15,2) NOT NULL,
    mounth INTEGER NOT NULL CHECK (mounth BETWEEN 1 AND 12), -- Note: keeping original column name "mounth"
    year INTEGER NOT NULL,
    score DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, mounth, year)
);

-- ============================================
-- 7. TRASH TABLES (for soft deletes)
-- ============================================

-- Trash table for deleted transactions
CREATE TABLE IF NOT EXISTS trash_trans (
    trash_trans_key INTEGER PRIMARY KEY,
    original_trans_key INTEGER,
    trans_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    trans_status VARCHAR(10) NOT NULL CHECK (trans_status IN ('deposit', 'withdraw')),
    trans_details TEXT,
    trans_details_link TEXT,
    category VARCHAR(100),
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Trash table for deleted wishlist items
CREATE TABLE IF NOT EXISTS trash_wishlist (
    trash_wish_key INTEGER PRIMARY KEY,
    original_wish_key INTEGER,
    wish_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    wish_details TEXT,
    year INTEGER NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(user_username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(user_mail);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_trans_user_id ON trans(user_id);
CREATE INDEX IF NOT EXISTS idx_trans_date ON trans(date);
CREATE INDEX IF NOT EXISTS idx_trans_user_date ON trans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_trans_currency ON trans(currency);
CREATE INDEX IF NOT EXISTS idx_trans_status ON trans(trans_status);
CREATE INDEX IF NOT EXISTS idx_trans_category ON trans(category);

-- Networth table indexes
CREATE INDEX IF NOT EXISTS idx_networth_user_id ON networth(user_id);
CREATE INDEX IF NOT EXISTS idx_networth_currency ON networth(currency);

-- Wishlist table indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_year ON wishlist(year);
CREATE INDEX IF NOT EXISTS idx_wishlist_status ON wishlist(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_year ON wishlist(user_id, year);

-- Scheduled transactions table indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_trans_user_id ON scheduled_trans(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trans_date ON scheduled_trans(date);
CREATE INDEX IF NOT EXISTS idx_scheduled_trans_status ON scheduled_trans(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_trans_last_added ON scheduled_trans(last_time_added);

-- Target table indexes
CREATE INDEX IF NOT EXISTS idx_target_user_id ON target(user_id);
CREATE INDEX IF NOT EXISTS idx_target_year_month ON target(year, mounth);

-- Trash table indexes
CREATE INDEX IF NOT EXISTS idx_trash_trans_user_id ON trash_trans(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_wishlist_user_id ON trash_wishlist(user_id);

-- ============================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Update networth updated_at timestamp when total changes
CREATE TRIGGER IF NOT EXISTS update_networth_timestamp 
    AFTER UPDATE OF total ON networth
    FOR EACH ROW
BEGIN
    UPDATE networth SET updated_at = CURRENT_TIMESTAMP WHERE networth_id = NEW.networth_id;
END;

-- ============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- ============================================
-- Uncomment the following section if you want to insert sample data

/*
-- Sample currencies that the application supports
-- This is informational only - the app has a hardcoded list in utils/user_info.py

-- Sample user (for testing purposes)
INSERT OR IGNORE INTO users (user_id, user_username, user_password, user_mail, user_mail_verify, favorite_currency) 
VALUES (1, 'testuser', 'pbkdf2:sha256:260000$sample$hash', 'test@example.com', 'verified', 'USD');

-- Sample networth entry
INSERT OR IGNORE INTO networth (networth_id, user_id, currency, total) 
VALUES (1, 1, 'USD', 1000.00);
*/

-- ============================================
-- 11. SCHEMA INFORMATION
-- ============================================
-- This schema supports:
-- - Multi-user financial management
-- - Multiple currencies per user
-- - Transaction tracking (deposits/withdrawals)
-- - Wishlist management with purchase tracking
-- - Scheduled/recurring transactions
-- - Monthly savings targets
-- - Soft deletion (trash tables)
-- - User authentication and preferences
-- - Email verification system
-- - Profile picture management

-- ============================================
-- 12. IMPORTANT NOTES
-- ============================================
-- 1. The application expects specific column names (e.g., 'mounth' instead of 'month')
-- 2. Currency codes should be 3-character ISO codes (USD, EUR, etc.)
-- 3. Decimal precision is set to 15,2 for financial calculations
-- 4. Foreign key constraints ensure data integrity
-- 5. Indexes are created for performance optimization
-- 6. The schema supports soft deletion via trash tables
-- 7. Default values are set for common fields
-- 8. Timestamps track creation and modification times

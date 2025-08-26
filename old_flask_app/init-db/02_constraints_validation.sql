-- Imhotep Finance Database - Additional Constraints and Validations
-- This file adds extra validation rules and constraints to ensure data integrity

-- ============================================
-- 1. ADDITIONAL CHECK CONSTRAINTS
-- ============================================

-- Ensure amounts are positive for transactions
ALTER TABLE trans ADD CONSTRAINT chk_trans_amount_positive CHECK (amount > 0);

-- Ensure amounts are positive for networth (can be 0 but not negative)
ALTER TABLE networth ADD CONSTRAINT chk_networth_total_non_negative CHECK (total >= 0);

-- Ensure wishlist prices are positive
ALTER TABLE wishlist ADD CONSTRAINT chk_wishlist_price_positive CHECK (price > 0);

-- Ensure scheduled transaction amounts are positive
ALTER TABLE scheduled_trans ADD CONSTRAINT chk_scheduled_amount_positive CHECK (amount > 0);

-- Ensure target amounts are positive
ALTER TABLE target ADD CONSTRAINT chk_target_positive CHECK (target > 0);

-- Ensure score is non-negative
ALTER TABLE target ADD CONSTRAINT chk_score_non_negative CHECK (score >= 0);

-- Ensure valid day of month for scheduled transactions (1-31)
ALTER TABLE scheduled_trans ADD CONSTRAINT chk_scheduled_date_valid CHECK (date BETWEEN 1 AND 31);

-- Ensure valid year for wishlist (reasonable range)
ALTER TABLE wishlist ADD CONSTRAINT chk_wishlist_year_valid CHECK (year BETWEEN 2000 AND 2100);

-- Ensure valid year for targets
ALTER TABLE target ADD CONSTRAINT chk_target_year_valid CHECK (year BETWEEN 2000 AND 2100);

-- ============================================
-- 2. CURRENCY VALIDATION
-- ============================================

-- Common currency codes validation (you can extend this list as needed)
ALTER TABLE trans ADD CONSTRAINT chk_trans_currency_valid CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 
                 'EGP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'LBP', 'SYP',
                 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'TRY',
                 'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD',
                 'ALL', 'BAM', 'MDL', 'GEL', 'AMD', 'AZN', 'KGS', 'KZT', 'UZS', 'TJS',
                 'TMT', 'MNT', 'KRW', 'THB', 'VND', 'LAK', 'KHR', 'MMK', 'IDR', 'MYR',
                 'SGD', 'PHP', 'BND', 'TWD', 'HKD', 'MOP', 'ZAR', 'BWP', 'NAD', 'SZL',
                 'LSL', 'ZMW', 'ZWL', 'MWK', 'TZS', 'UGX', 'KES', 'RWF', 'BIF', 'DJF',
                 'ERN', 'ETB', 'SOS', 'SCR', 'MUR', 'MGA', 'KMF', 'AOA', 'CDF', 'XAF',
                 'XOF', 'XPF', 'MAD', 'DZD', 'TND', 'LYD', 'EGP', 'SDG', 'SSP', 'NGN',
                 'GHS', 'SLE', 'LRD', 'GMD', 'GNF', 'SLL', 'CVE', 'STN', 'BRL', 'ARS',
                 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'UYU', 'GYD', 'SRD', 'VES', 'TTD',
                 'JMD', 'BBD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP',
                 'HTG', 'DOP', 'MXN', 'XCD', 'AWG', 'ANG', 'FJD', 'PGK', 'SBD', 'VUV',
                 'WST', 'TOP', 'TVD', 'KID', 'NZD', 'CKD', 'FKP', 'GIP', 'GGP', 'IMP',
                 'JEP', 'SHP', 'ISK', 'NOK', 'DKK', 'FOK')
);

-- Apply same currency validation to other tables
ALTER TABLE networth ADD CONSTRAINT chk_networth_currency_valid CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 
                 'EGP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'LBP', 'SYP',
                 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'TRY',
                 'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD',
                 'ALL', 'BAM', 'MDL', 'GEL', 'AMD', 'AZN', 'KGS', 'KZT', 'UZS', 'TJS',
                 'TMT', 'MNT', 'KRW', 'THB', 'VND', 'LAK', 'KHR', 'MMK', 'IDR', 'MYR',
                 'SGD', 'PHP', 'BND', 'TWD', 'HKD', 'MOP', 'ZAR', 'BWP', 'NAD', 'SZL',
                 'LSL', 'ZMW', 'ZWL', 'MWK', 'TZS', 'UGX', 'KES', 'RWF', 'BIF', 'DJF',
                 'ERN', 'ETB', 'SOS', 'SCR', 'MUR', 'MGA', 'KMF', 'AOA', 'CDF', 'XAF',
                 'XOF', 'XPF', 'MAD', 'DZD', 'TND', 'LYD', 'EGP', 'SDG', 'SSP', 'NGN',
                 'GHS', 'SLE', 'LRD', 'GMD', 'GNF', 'SLL', 'CVE', 'STN', 'BRL', 'ARS',
                 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'UYU', 'GYD', 'SRD', 'VES', 'TTD',
                 'JMD', 'BBD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP',
                 'HTG', 'DOP', 'MXN', 'XCD', 'AWG', 'ANG', 'FJD', 'PGK', 'SBD', 'VUV',
                 'WST', 'TOP', 'TVD', 'KID', 'NZD', 'CKD', 'FKP', 'GIP', 'GGP', 'IMP',
                 'JEP', 'SHP', 'ISK', 'NOK', 'DKK', 'FOK')
);

ALTER TABLE wishlist ADD CONSTRAINT chk_wishlist_currency_valid CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 
                 'EGP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'LBP', 'SYP',
                 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'TRY',
                 'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD',
                 'ALL', 'BAM', 'MDL', 'GEL', 'AMD', 'AZN', 'KGS', 'KZT', 'UZS', 'TJS',
                 'TMT', 'MNT', 'KRW', 'THB', 'VND', 'LAK', 'KHR', 'MMK', 'IDR', 'MYR',
                 'SGD', 'PHP', 'BND', 'TWD', 'HKD', 'MOP', 'ZAR', 'BWP', 'NAD', 'SZL',
                 'LSL', 'ZMW', 'ZWL', 'MWK', 'TZS', 'UGX', 'KES', 'RWF', 'BIF', 'DJF',
                 'ERN', 'ETB', 'SOS', 'SCR', 'MUR', 'MGA', 'KMF', 'AOA', 'CDF', 'XAF',
                 'XOF', 'XPF', 'MAD', 'DZD', 'TND', 'LYD', 'EGP', 'SDG', 'SSP', 'NGN',
                 'GHS', 'SLE', 'LRD', 'GMD', 'GNF', 'SLL', 'CVE', 'STN', 'BRL', 'ARS',
                 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'UYU', 'GYD', 'SRD', 'VES', 'TTD',
                 'JMD', 'BBD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP',
                 'HTG', 'DOP', 'MXN', 'XCD', 'AWG', 'ANG', 'FJD', 'PGK', 'SBD', 'VUV',
                 'WST', 'TOP', 'TVD', 'KID', 'NZD', 'CKD', 'FKP', 'GIP', 'GGP', 'IMP',
                 'JEP', 'SHP', 'ISK', 'NOK', 'DKK', 'FOK')
);

ALTER TABLE scheduled_trans ADD CONSTRAINT chk_scheduled_currency_valid CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 
                 'EGP', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'LBP', 'SYP',
                 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'AFN', 'IRR', 'IQD', 'TRY',
                 'RUB', 'UAH', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD',
                 'ALL', 'BAM', 'MDL', 'GEL', 'AMD', 'AZN', 'KGS', 'KZT', 'UZS', 'TJS',
                 'TMT', 'MNT', 'KRW', 'THB', 'VND', 'LAK', 'KHR', 'MMK', 'IDR', 'MYR',
                 'SGD', 'PHP', 'BND', 'TWD', 'HKD', 'MOP', 'ZAR', 'BWP', 'NAD', 'SZL',
                 'LSL', 'ZMW', 'ZWL', 'MWK', 'TZS', 'UGX', 'KES', 'RWF', 'BIF', 'DJF',
                 'ERN', 'ETB', 'SOS', 'SCR', 'MUR', 'MGA', 'KMF', 'AOA', 'CDF', 'XAF',
                 'XOF', 'XPF', 'MAD', 'DZD', 'TND', 'LYD', 'EGP', 'SDG', 'SSP', 'NGN',
                 'GHS', 'SLE', 'LRD', 'GMD', 'GNF', 'SLL', 'CVE', 'STN', 'BRL', 'ARS',
                 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'UYU', 'GYD', 'SRD', 'VES', 'TTD',
                 'JMD', 'BBD', 'BSD', 'BZD', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'CUP',
                 'HTG', 'DOP', 'MXN', 'XCD', 'AWG', 'ANG', 'FJD', 'PGK', 'SBD', 'VUV',
                 'WST', 'TOP', 'TVD', 'KID', 'NZD', 'CKD', 'FKP', 'GIP', 'GGP', 'IMP',
                 'JEP', 'SHP', 'ISK', 'NOK', 'DKK', 'FOK')
);

-- ============================================
-- 3. EMAIL VALIDATION
-- ============================================

-- Basic email format validation
ALTER TABLE users ADD CONSTRAINT chk_users_email_format CHECK (
    user_mail LIKE '%@%.%' AND 
    LENGTH(user_mail) >= 5 AND 
    LENGTH(user_mail) <= 100
);

-- ============================================
-- 4. USERNAME VALIDATION
-- ============================================

-- Username length and character validation
ALTER TABLE users ADD CONSTRAINT chk_users_username_format CHECK (
    LENGTH(user_username) >= 3 AND 
    LENGTH(user_username) <= 50 AND
    user_username NOT LIKE '% %' -- No spaces allowed
);

-- ============================================
-- 5. ADDITIONAL BUSINESS RULES
-- ============================================

-- Ensure trans_id is unique per user (but not globally)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trans_user_trans_id ON trans(user_id, trans_id);

-- Ensure wish_id is unique per user (but not globally)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_wish_id ON wishlist(user_id, wish_id);

-- Ensure scheduled_trans_id is unique per user (but not globally)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_trans_user_id ON scheduled_trans(user_id, scheduled_trans_id);

-- ============================================
-- 6. PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trans_user_status_date ON trans(user_id, trans_status, date);
CREATE INDEX IF NOT EXISTS idx_trans_user_currency_status ON trans(user_id, currency, trans_status);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_year_status ON wishlist(user_id, year, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_trans_user_status ON scheduled_trans(user_id, status);

-- ============================================
-- 7. DATA INTEGRITY VIEWS (OPTIONAL)
-- ============================================

-- View to check data consistency
CREATE VIEW IF NOT EXISTS data_integrity_check AS
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_mail_verify = 'verified' THEN 1 END) as verified_users
FROM users
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM trans
UNION ALL
SELECT 
    'networth' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM networth;

-- View to show user summary statistics
CREATE VIEW IF NOT EXISTS user_summary AS
SELECT 
    u.user_id,
    u.user_username,
    u.user_mail,
    u.favorite_currency,
    u.user_mail_verify,
    COUNT(DISTINCT t.trans_key) as total_transactions,
    COUNT(DISTINCT n.currency) as currencies_used,
    COUNT(DISTINCT w.wish_key) as total_wishes,
    COUNT(DISTINCT s.scheduled_trans_key) as scheduled_transactions
FROM users u
LEFT JOIN trans t ON u.user_id = t.user_id
LEFT JOIN networth n ON u.user_id = n.user_id
LEFT JOIN wishlist w ON u.user_id = w.user_id
LEFT JOIN scheduled_trans s ON u.user_id = s.user_id
GROUP BY u.user_id, u.user_username, u.user_mail, u.favorite_currency, u.user_mail_verify;

-- ============================================
-- 8. CLEANUP PROCEDURES (OPTIONAL)
-- ============================================

-- Note: These are comments for manual cleanup procedures
-- You can create stored procedures or scheduled jobs for these

-- Clean up old trash records (older than 90 days)
-- DELETE FROM trash_trans WHERE deleted_at < DATE('now', '-90 days');
-- DELETE FROM trash_wishlist WHERE deleted_at < DATE('now', '-90 days');

-- Clean up unverified users older than 30 days
-- DELETE FROM users WHERE user_mail_verify = 'not_verified' AND created_at < DATE('now', '-30 days');

-- ============================================
-- 9. BACKUP RECOMMENDATIONS
-- ============================================

-- Regular backup schedule recommendations:
-- - Daily backup of the entire database
-- - Weekly full backup with compression
-- - Monthly archival backup
-- - Test restore procedures regularly
-- - Keep backups in multiple locations

-- Important tables to prioritize in backup:
-- 1. users (user accounts and preferences)
-- 2. trans (transaction history)
-- 3. networth (current financial status)
-- 4. wishlist (user goals and purchases)
-- 5. scheduled_trans (recurring transactions)
-- 6. target (savings goals)

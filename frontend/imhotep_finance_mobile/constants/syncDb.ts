/**
 * syncDb.ts — Singleton SQLite Database for Offline Sync Queue
 * =============================================================
 * Initialises the local SQLite database once and returns a shared handle.
 *
 * Tables:
 *   - pending_transactions : local queue of transaction records to sync
 *   - pending_networth     : local queue of networth records to sync
 *   - pending_wishlist     : local queue of wishlist records to sync
 *
 * Row lifecycle:
 *   pending  → (flush) → synced   : successfully pushed to server
 *   pending  → (flush) → failed   : server rejected or network error
 *   failed   → (retry) → pending  : re-queued for next flush
 *
 * Note: expo-sqlite is already bundled with Expo. No extra install needed.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'imhotep_sync.db';

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLite database, creating tables on first open.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  await _db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS pending_transactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid    TEXT    NOT NULL UNIQUE,
      updated_at     TEXT    NOT NULL,
      is_deleted     INTEGER NOT NULL DEFAULT 0,
      date           TEXT,
      amount         REAL,
      currency       TEXT,
      trans_status   TEXT,
      trans_details  TEXT,
      category       TEXT,
      place          TEXT,
      sync_status    TEXT    NOT NULL DEFAULT 'pending',
      error_msg      TEXT,
      created_local  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_networth (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid    TEXT    NOT NULL UNIQUE,
      updated_at     TEXT    NOT NULL,
      is_deleted     INTEGER NOT NULL DEFAULT 0,
      total          REAL,
      currency       TEXT,
      place          TEXT,
      sync_status    TEXT    NOT NULL DEFAULT 'pending',
      error_msg      TEXT,
      created_local  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_wishlist (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid    TEXT    NOT NULL UNIQUE,
      updated_at     TEXT    NOT NULL,
      is_deleted     INTEGER NOT NULL DEFAULT 0,
      year           INTEGER,
      price          REAL,
      currency       TEXT,
      status         INTEGER NOT NULL DEFAULT 0,
      link           TEXT,
      wish_details   TEXT,
      place          TEXT,
      sync_status    TEXT    NOT NULL DEFAULT 'pending',
      error_msg      TEXT,
      created_local  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

/**
 * Close and reset the singleton (useful for testing).
 */
export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

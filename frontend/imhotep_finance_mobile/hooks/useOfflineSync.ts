/**
 * useOfflineSync — Offline Queue & Cloud Sync Hook
 * =================================================
 * Provides three queue functions to write local records into the SQLite
 * pending tables, and a `flushQueue()` function that pushes all pending
 * records to the server's POST /api/sync/push/ endpoint.
 *
 * Strategy: Mobile-Wins Last-Write-Wins
 *   - Each record carries a `client_uuid` (generated on mobile before creation)
 *     and an `updated_at` ISO timestamp.
 *   - The server accepts the mobile data and overwrites if mobile's timestamp
 *     is >= the server's stored timestamp.
 *   - Soft-deleted records set `is_deleted: true` (no hard local delete needed).
 *
 * Usage:
 *   const { queueTransaction, queueNetworth, queueWishlist, flushQueue, isSyncing } = useOfflineSync();
 *
 *   // When creating a transaction offline:
 *   const id = await queueTransaction({
 *     amount: 50, currency: 'USD', trans_status: 'Withdraw',
 *     trans_details: 'Coffee', category: 'Food', place: 'General',
 *     date: '2025-05-28', is_deleted: false,
 *   });
 *
 *   // Call manually or let useNetworkSync call it automatically:
 *   await flushQueue();
 */

import { useCallback, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto'; // Use expo-crypto for UUID generation
import api from '@/constants/api';
import { getDb } from '@/constants/syncDb';

// ---- Type definitions ----

export interface PendingTransaction {
  client_uuid?: string;  // auto-generated if omitted
  updated_at?: string;   // auto-generated to now if omitted
  is_deleted?: boolean;
  date?: string;
  amount?: number;
  currency?: string;
  trans_status?: 'Withdraw' | 'Deposit';
  trans_details?: string;
  category?: string;
  place?: string;
}

export interface PendingNetworth {
  client_uuid?: string;
  updated_at?: string;
  is_deleted?: boolean;
  total?: number;
  currency?: string;
  place?: string;
}

export interface PendingWishlist {
  client_uuid?: string;
  updated_at?: string;
  is_deleted?: boolean;
  year?: number;
  price?: number;
  currency?: string;
  status?: boolean;
  link?: string;
  wish_details?: string;
  place?: string;
}

export interface SyncResult {
  synced: { transactions: number; networth: number; wishlist: number };
  skipped: { transactions: number; networth: number; wishlist: number };
  errors: string[];
}

// ---- Helpers ----

function nowIso(): string {
  return new Date().toISOString();
}

async function generateUUID(): Promise<string> {
  // expo-crypto provides a cryptographically random UUID v4
  return Crypto.randomUUID();
}

// ---- Hook ----

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  /**
   * Queue a transaction into the local pending_transactions table.
   * Returns the client_uuid of the queued record.
   */
  const queueTransaction = useCallback(async (data: PendingTransaction): Promise<string> => {
    const db = await getDb();
    const client_uuid = data.client_uuid ?? (await generateUUID());
    const updated_at = data.updated_at ?? nowIso();

    await db.runAsync(
      `INSERT INTO pending_transactions
         (client_uuid, updated_at, is_deleted, date, amount, currency,
          trans_status, trans_details, category, place, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
       ON CONFLICT(client_uuid) DO UPDATE SET
         updated_at   = excluded.updated_at,
         is_deleted   = excluded.is_deleted,
         date         = excluded.date,
         amount       = excluded.amount,
         currency     = excluded.currency,
         trans_status = excluded.trans_status,
         trans_details= excluded.trans_details,
         category     = excluded.category,
         place        = excluded.place,
         sync_status  = 'pending',
         error_msg    = NULL`,
      [
        client_uuid,
        updated_at,
        data.is_deleted ? 1 : 0,
        data.date ?? null,
        data.amount ?? 0,
        data.currency ?? 'USD',
        data.trans_status ?? 'Withdraw',
        data.trans_details ?? '',
        data.category ?? '',
        data.place ?? 'General',
      ],
    );

    return client_uuid;
  }, []);

  /**
   * Queue a networth record into the local pending_networth table.
   * Returns the client_uuid of the queued record.
   */
  const queueNetworth = useCallback(async (data: PendingNetworth): Promise<string> => {
    const db = await getDb();
    const client_uuid = data.client_uuid ?? (await generateUUID());
    const updated_at = data.updated_at ?? nowIso();

    await db.runAsync(
      `INSERT INTO pending_networth
         (client_uuid, updated_at, is_deleted, total, currency, place, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       ON CONFLICT(client_uuid) DO UPDATE SET
         updated_at  = excluded.updated_at,
         is_deleted  = excluded.is_deleted,
         total       = excluded.total,
         currency    = excluded.currency,
         place       = excluded.place,
         sync_status = 'pending',
         error_msg   = NULL`,
      [
        client_uuid,
        updated_at,
        data.is_deleted ? 1 : 0,
        data.total ?? 0,
        data.currency ?? 'USD',
        data.place ?? 'General',
      ],
    );

    return client_uuid;
  }, []);

  /**
   * Queue a wishlist item into the local pending_wishlist table.
   * Returns the client_uuid of the queued record.
   */
  const queueWishlist = useCallback(async (data: PendingWishlist): Promise<string> => {
    const db = await getDb();
    const client_uuid = data.client_uuid ?? (await generateUUID());
    const updated_at = data.updated_at ?? nowIso();

    await db.runAsync(
      `INSERT INTO pending_wishlist
         (client_uuid, updated_at, is_deleted, year, price, currency,
          status, link, wish_details, place, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
       ON CONFLICT(client_uuid) DO UPDATE SET
         updated_at   = excluded.updated_at,
         is_deleted   = excluded.is_deleted,
         year         = excluded.year,
         price        = excluded.price,
         currency     = excluded.currency,
         status       = excluded.status,
         link         = excluded.link,
         wish_details = excluded.wish_details,
         place        = excluded.place,
         sync_status  = 'pending',
         error_msg    = NULL`,
      [
        client_uuid,
        updated_at,
        data.is_deleted ? 1 : 0,
        data.year ?? new Date().getFullYear(),
        data.price ?? 0,
        data.currency ?? 'USD',
        data.status ? 1 : 0,
        data.link ?? '',
        data.wish_details ?? '',
        data.place ?? 'General',
      ],
    );

    return client_uuid;
  }, []);

  /**
   * Flush all pending local records to the server.
   * - Reads all rows with sync_status = 'pending'
   * - Sends one batch POST to /api/sync/push/
   * - Marks successfully synced rows as 'synced'
   * - Marks failed rows as 'failed' with an error_msg
   *
   * This is safe to call concurrently — the syncInProgress ref prevents double-flush.
   */
  const flushQueue = useCallback(async (): Promise<SyncResult | null> => {
    if (syncInProgress.current) {
      console.log('[Sync] Flush already in progress, skipping.');
      return null;
    }

    const db = await getDb();

    // Read pending rows from all tables
    const [pendingTransactions, pendingNetworth, pendingWishlist] = await Promise.all([
      db.getAllAsync<any>(
        `SELECT * FROM pending_transactions WHERE sync_status = 'pending'`
      ),
      db.getAllAsync<any>(
        `SELECT * FROM pending_networth WHERE sync_status = 'pending'`
      ),
      db.getAllAsync<any>(
        `SELECT * FROM pending_wishlist WHERE sync_status = 'pending'`
      ),
    ]);

    const totalPending =
      pendingTransactions.length + pendingNetworth.length + pendingWishlist.length;

    if (totalPending === 0) {
      console.log('[Sync] No pending records to flush.');
      return {
        synced: { transactions: 0, networth: 0, wishlist: 0 },
        skipped: { transactions: 0, networth: 0, wishlist: 0 },
        errors: [],
      };
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    console.log(`[Sync] Flushing ${totalPending} pending records...`);

    try {
      // Map SQLite rows to server payload format
      const transactionPayload = pendingTransactions.map((r: any) => ({
        client_uuid: r.client_uuid,
        updated_at: r.updated_at,
        is_deleted: r.is_deleted === 1,
        date: r.date,
        amount: r.amount,
        currency: r.currency,
        trans_status: r.trans_status,
        trans_details: r.trans_details,
        category: r.category,
        place: r.place,
      }));

      const networthPayload = pendingNetworth.map((r: any) => ({
        client_uuid: r.client_uuid,
        updated_at: r.updated_at,
        is_deleted: r.is_deleted === 1,
        total: r.total,
        currency: r.currency,
        place: r.place,
      }));

      const wishlistPayload = pendingWishlist.map((r: any) => ({
        client_uuid: r.client_uuid,
        updated_at: r.updated_at,
        is_deleted: r.is_deleted === 1,
        year: r.year,
        price: r.price,
        currency: r.currency,
        status: r.status === 1,
        link: r.link,
        wish_details: r.wish_details,
        place: r.place,
      }));

      const response = await api.post<SyncResult>('/api/sync/push/', {
        transactions: transactionPayload,
        networth: networthPayload,
        wishlist: wishlistPayload,
      });

      const result = response.data;

      // Mark all sent rows as 'synced' (server accepted them — errors are partial, not fatal)
      await Promise.all([
        ...pendingTransactions.map((r: any) =>
          db.runAsync(
            `UPDATE pending_transactions SET sync_status = 'synced' WHERE client_uuid = ?`,
            [r.client_uuid]
          )
        ),
        ...pendingNetworth.map((r: any) =>
          db.runAsync(
            `UPDATE pending_networth SET sync_status = 'synced' WHERE client_uuid = ?`,
            [r.client_uuid]
          )
        ),
        ...pendingWishlist.map((r: any) =>
          db.runAsync(
            `UPDATE pending_wishlist SET sync_status = 'synced' WHERE client_uuid = ?`,
            [r.client_uuid]
          )
        ),
      ]);

      console.log('[Sync] Flush complete:', result);
      return result;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error ?? error.message ?? 'Network error';
      console.error('[Sync] Flush failed:', errMsg);

      // Mark all pending rows as 'failed' so they can be retried later
      await Promise.all([
        ...pendingTransactions.map((r: any) =>
          db.runAsync(
            `UPDATE pending_transactions SET sync_status = 'failed', error_msg = ? WHERE client_uuid = ?`,
            [errMsg, r.client_uuid]
          )
        ),
        ...pendingNetworth.map((r: any) =>
          db.runAsync(
            `UPDATE pending_networth SET sync_status = 'failed', error_msg = ? WHERE client_uuid = ?`,
            [errMsg, r.client_uuid]
          )
        ),
        ...pendingWishlist.map((r: any) =>
          db.runAsync(
            `UPDATE pending_wishlist SET sync_status = 'failed', error_msg = ? WHERE client_uuid = ?`,
            [errMsg, r.client_uuid]
          )
        ),
      ]);

      return null;
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, []);

  /**
   * Retry all 'failed' rows by resetting their status back to 'pending',
   * then immediately flushing.
   */
  const retryFailed = useCallback(async (): Promise<SyncResult | null> => {
    const db = await getDb();
    await Promise.all([
      db.runAsync(
        `UPDATE pending_transactions SET sync_status = 'pending', error_msg = NULL WHERE sync_status = 'failed'`
      ),
      db.runAsync(
        `UPDATE pending_networth SET sync_status = 'pending', error_msg = NULL WHERE sync_status = 'failed'`
      ),
      db.runAsync(
        `UPDATE pending_wishlist SET sync_status = 'pending', error_msg = NULL WHERE sync_status = 'failed'`
      ),
    ]);
    return flushQueue();
  }, [flushQueue]);

  /**
   * Get pending count for UI badge display.
   */
  const getPendingCount = useCallback(async (): Promise<number> => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ cnt: number }>(
      `SELECT (
         (SELECT COUNT(*) FROM pending_transactions WHERE sync_status = 'pending') +
         (SELECT COUNT(*) FROM pending_networth    WHERE sync_status = 'pending') +
         (SELECT COUNT(*) FROM pending_wishlist    WHERE sync_status = 'pending')
       ) AS cnt`
    );
    return rows[0]?.cnt ?? 0;
  }, []);

  return {
    queueTransaction,
    queueNetworth,
    queueWishlist,
    flushQueue,
    retryFailed,
    getPendingCount,
    isSyncing,
  };
}

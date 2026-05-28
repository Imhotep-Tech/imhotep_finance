/**
 * useNetworkSync — Automatic Connectivity-Triggered Sync
 * =======================================================
 * Watches the device's network connectivity using @react-native-community/netinfo
 * (already in package.json). When connectivity changes from offline → online,
 * it automatically calls flushQueue() to push any queued offline changes.
 *
 * Usage — mount once at the app root level (e.g., inside your root _layout.tsx
 * or AuthProvider, but only when the user is authenticated):
 *
 *   // In app/(tabs)/_layout.tsx or similar:
 *   import { useNetworkSync } from '@/hooks/useNetworkSync';
 *
 *   export default function TabLayout() {
 *     const { isConnected, isSyncing, lastSyncAt } = useNetworkSync();
 *     // Optionally pass isConnected to OfflineBanner
 *     return (
 *       <>
 *         <OfflineBanner isOffline={!isConnected} />
 *         <Tabs>...</Tabs>
 *       </>
 *     );
 *   }
 *
 * The hook exposes:
 *   - isConnected    : current network state (null = unknown, true/false)
 *   - isSyncing      : true while a flush is in progress
 *   - lastSyncAt     : Date of the last successful flush (or null)
 *   - manualSync()   : trigger a flush manually (e.g., pull-to-refresh)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useOfflineSync } from './useOfflineSync';
import { useAuth } from '@/contexts/AuthContext';

export function useNetworkSync() {
  const { isAuthenticated } = useAuth();
  const { flushQueue, isSyncing } = useOfflineSync();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const wasOfflineRef = useRef<boolean>(false);

  const handleConnectivityChange = useCallback(
    async (state: NetInfoState) => {
      const connected = !!(state.isConnected && state.isInternetReachable);
      setIsConnected(connected);

      if (!isAuthenticated) return;

      if (connected && wasOfflineRef.current) {
        // Device just came back online — flush the queue
        console.log('[NetworkSync] Connection restored — flushing pending sync queue...');
        const result = await flushQueue();
        if (result !== null) {
          setLastSyncAt(new Date());
        }
      }

      wasOfflineRef.current = !connected;
    },
    [isAuthenticated, flushQueue],
  );

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    // Fetch the current state immediately so isConnected isn't stuck as null
    NetInfo.fetch().then((state) => {
      const connected = !!(state.isConnected && state.isInternetReachable);
      setIsConnected(connected);
      wasOfflineRef.current = !connected;
    });

    return () => {
      unsubscribe();
    };
  }, [handleConnectivityChange]);

  /**
   * Manually trigger a sync flush.
   * Useful for pull-to-refresh or a "Sync Now" button.
   */
  const manualSync = useCallback(async () => {
    if (!isAuthenticated || !isConnected) return null;
    const result = await flushQueue();
    if (result !== null) {
      setLastSyncAt(new Date());
    }
    return result;
  }, [isAuthenticated, isConnected, flushQueue]);

  return {
    isConnected,
    isSyncing,
    lastSyncAt,
    manualSync,
  };
}

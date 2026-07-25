import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import ScheduledTransactionItem, { ScheduledTransaction } from '@/components/ScheduledTransactionItem';
import AddScheduledTransactionModal from '@/components/AddScheduledTransactionModal';
import PressableScale from '@/components/ui/PressableScale';
import TransactionListSkeleton from '@/components/ui/TransactionListSkeleton';
import { EmptyState, ErrorCard } from '@/components/ui/StateViews';
import { updateNetworthWidget } from '@/widgets/widget-updater';

export default function ScheduledTransactionsScreen() {
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editTransaction, setEditTransaction] = useState<ScheduledTransaction | null>(null);

  const fetchTransactions = async (pageNum: number, refresh: boolean = false) => {
    if (loading && !refresh) return;
    setLoading(true);
    setError('');

    try {
      const params = { page: pageNum };
      const res = await api.get('/api/finance-management/scheduled-trans/get-scheduled-trans/', {
        params,
      });

      const newTransactions: ScheduledTransaction[] = res.data.scheduled_transactions || [];

      if (refresh) {
        setTransactions(newTransactions);
      } else {
        setTransactions((prev) => [...prev, ...newTransactions]);
      }

      setHasMore(newTransactions.length >= 10);
    } catch (err) {
      console.error('Fetch scheduled transactions error:', err);
      setError('Failed to load scheduled transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTransactions(1, true);
  };

  const handleEdit = (transaction: ScheduledTransaction) => {
    setEditTransaction(transaction);
    setShowAddModal(true);
  };

  const handleToggleStatus = async (transaction: ScheduledTransaction) => {
    if (actionLoading[transaction.id]) return;

    const originalStatus = transaction.status;
    const newStatus = !originalStatus;

    setTransactions((prev) =>
      prev.map((t) => (t.id === transaction.id ? { ...t, status: newStatus } : t))
    );

    setActionLoading((prev) => ({ ...prev, [transaction.id]: true }));

    try {
      const res = await api.post(
        `/api/finance-management/scheduled-trans/update-scheduled-trans-status/${transaction.id}/`
      );
      updateNetworthWidget();

      if (res.data.status !== undefined && res.data.status !== newStatus) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === transaction.id ? { ...t, status: res.data.status } : t))
        );
      }
    } catch (err: any) {
      console.error('Status toggle error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? { ...t, status: originalStatus } : t))
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [transaction.id]: false }));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Scheduled Transactions</Text>
          <Text style={styles.headerSubtitle}>Automated & Recurring Monthly Rules</Text>
        </View>
      </View>

      {/* Main List */}
      {loading && transactions.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TransactionListSkeleton />
        </View>
      ) : error ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <ErrorCard message={error} onRetry={onRefresh} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ScheduledTransactionItem
              transaction={item}
              onPress={() => handleEdit(item)}
              onToggleStatus={() => handleToggleStatus(item)}
              loading={actionLoading[item.id]}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ImhotepTheme.colors.primaryTealGlow}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title="No Scheduled Transactions"
              message="Set up recurring deposits or expenses to apply automatically on your designated day of the month."
              actionLabel="Create Scheduled Rule"
              onAction={() => {
                setEditTransaction(null);
                setShowAddModal(true);
              }}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Add FAB */}
      <PressableScale
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
        onPress={() => {
          setEditTransaction(null);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </PressableScale>

      {/* Add / Edit Modal */}
      <AddScheduledTransactionModal
        visible={showAddModal}
        editMode={!!editTransaction}
        initialValues={editTransaction || {}}
        initialType={(editTransaction?.scheduled_trans_status as any)?.toLowerCase() || 'deposit'}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          onRefresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ImhotepTheme.colors.backgroundDark,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.backgroundSurface,
    borderBottomWidth: 1,
    borderBottomColor: ImhotepTheme.colors.glassBorder,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ImhotepTheme.colors.primaryTealGlow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

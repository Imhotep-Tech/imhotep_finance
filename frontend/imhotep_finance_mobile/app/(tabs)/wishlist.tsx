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
import WishlistItem, { WishItem } from '@/components/WishlistItem';
import AddWishlistModal from '@/components/AddWishlistModal';
import PressableScale from '@/components/ui/PressableScale';
import TransactionListSkeleton from '@/components/ui/TransactionListSkeleton';
import { EmptyState } from '@/components/ui/StateViews';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();

  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [deleteLoading, setDeleteLoading] = useState<{ [key: number]: boolean }>({});

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editWish, setEditWish] = useState<WishItem | null>(null);

  const fetchWishlist = async (pageNum: number, refresh: boolean = false, currentYear: number) => {
    if (loading && !refresh) return;
    setLoading(true);

    try {
      const params = { page: pageNum, year: currentYear };
      const res = await api.get('/api/finance-management/wishlist/get-wishlist/', { params });
      const newWishlist: WishItem[] = res.data.wishlist || [];

      if (refresh) {
        setWishlist(newWishlist);
      } else {
        setWishlist((prev) => [...prev, ...newWishlist]);
      }

      const totalPages = res.data.pagination?.num_pages || 1;
      setHasMore(pageNum < totalPages);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWishlist(1, true, year);
  }, [year]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchWishlist(1, true, year);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWishlist(nextPage, false, year);
    }
  };

  const handleEdit = (wish: WishItem) => {
    setEditWish(wish);
    setShowAddModal(true);
  };

  const handleDelete = async (wish: WishItem) => {
    Alert.alert(
      'Delete Wish',
      'Are you sure you want to delete this wishlist item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading((prev) => ({ ...prev, [wish.id]: true }));
            try {
              await api.delete(`/api/finance-management/wishlist/delete-wish/${wish.id}/`);
              setWishlist((prev) => prev.filter((w) => w.id !== wish.id));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete wish');
            } finally {
              setDeleteLoading((prev) => ({ ...prev, [wish.id]: false }));
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = (wish: WishItem) => {
    const isCompleting = !wish.status;

    const proceedToggle = async () => {
      setActionLoading((prev) => ({ ...prev, [wish.id]: true }));
      try {
        await api.post(`/api/finance-management/wishlist/update-wish-status/${wish.id}/`);
        onRefresh();
      } catch (err: any) {
        console.error('Status toggle error:', err);
        Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
      } finally {
        setActionLoading((prev) => ({ ...prev, [wish.id]: false }));
      }
    };

    if (!isCompleting) {
      Alert.alert(
        'Warning',
        'Are you sure you want to mark this wish as incomplete?\n\nThis will remove the transaction date and recalculate your networth.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: proceedToggle },
        ]
      );
    } else {
      Alert.alert(
        'Mark as Completed',
        'This will convert your wish into an expense transaction.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: proceedToggle },
        ]
      );
    }
  };

  const handleYearChange = (increment: number) => {
    setYear((prev) => prev + increment);
    setPage(1);
  };

  return (
    <View style={styles.container}>
      {/* Sleek Glass Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Wishlist Goals</Text>
          <Text style={styles.headerSubtitle}>Plan & Track Future Assets</Text>
        </View>

        {/* Year Filter Pill */}
        <View style={styles.yearFilterPill}>
          <PressableScale onPress={() => handleYearChange(-1)} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={18} color={ImhotepTheme.colors.textPrimary} />
          </PressableScale>
          <Text style={styles.yearText}>{year}</Text>
          <PressableScale onPress={() => handleYearChange(1)} style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={18} color={ImhotepTheme.colors.textPrimary} />
          </PressableScale>
        </View>
      </View>

      {/* Main List */}
      {loading && wishlist.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TransactionListSkeleton />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <WishlistItem
              wish={item}
              onPress={() => handleEdit(item)}
              onToggleStatus={() => handleToggleStatus(item)}
              onDelete={() => handleDelete(item)}
              loading={actionLoading[item.id]}
              deleteLoading={deleteLoading[item.id]}
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
              title={`No Wish Goals for ${year}`}
              message="Add items to your wishlist to plan ahead for future savings and asset purchases."
              actionLabel="Add Wish Goal"
              onAction={() => {
                setEditWish(null);
                setShowAddModal(true);
              }}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Add Wish FAB */}
      <PressableScale
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
        onPress={() => {
          setEditWish(null);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </PressableScale>

      {/* Add / Edit Wishlist Modal */}
      <AddWishlistModal
        visible={showAddModal}
        editMode={!!editWish}
        initialValues={editWish || {}}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          onRefresh();
        }}
        currentYear={year}
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
  yearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  arrowButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
    color: ImhotepTheme.colors.primaryTealGlow,
    marginHorizontal: 6,
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

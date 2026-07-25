import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  Platform,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import { updateNetworthWidget } from '@/widgets/widget-updater';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionModal from '@/components/AddTransactionModal';
import CategorySelect from '@/components/CategorySelect';
import PlaceSelect from '@/components/PlaceSelect';
import PressableScale from '@/components/ui/PressableScale';
import TransactionListSkeleton from '@/components/ui/TransactionListSkeleton';
import { EmptyState, ErrorCard } from '@/components/ui/StateViews';
import useTransactionList from '@/hooks/useTransactionList';
import { Transaction } from '@/types/finance';

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ place?: string }>();
  const placeParam = params.place || '';

  const {
    transactions,
    loading,
    refreshing,
    hasMore,
    error,
    filters,
    refreshList,
    loadMore,
    updateFilters,
    clearFilters,
    fetchTransactions,
  } = useTransactionList(placeParam);

  // Modals & UI Controls
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  // Date Pickers state inside filter modal
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  // Temporary local filter states before "Apply" is tapped
  const [tempStatus, setTempStatus] = useState<string>(filters.statusFilter || '');
  const [tempCategory, setTempCategory] = useState<string>(filters.categoryFilter || '');
  const [tempPlace, setTempPlace] = useState<string>(filters.placeFilter || '');
  const [tempSearch, setTempSearch] = useState<string>(filters.detailsSearch || '');
  const [tempStartDate, setTempStartDate] = useState<Date | null>(filters.startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(filters.endDate || null);

  const hasActiveFilters = !!(
    filters.startDate ||
    filters.endDate ||
    filters.statusFilter ||
    filters.categoryFilter ||
    filters.placeFilter ||
    filters.detailsSearch
  );

  const handleOpenFilterModal = () => {
    setTempStatus(filters.statusFilter || '');
    setTempCategory(filters.categoryFilter || '');
    setTempPlace(filters.placeFilter || '');
    setTempSearch(filters.detailsSearch || '');
    setTempStartDate(filters.startDate || null);
    setTempEndDate(filters.endDate || null);
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    updateFilters({
      statusFilter: tempStatus,
      categoryFilter: tempCategory,
      placeFilter: tempPlace,
      detailsSearch: tempSearch,
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
  };

  const handleClearAllFilters = () => {
    setTempStatus('');
    setTempCategory('');
    setTempPlace('');
    setTempSearch('');
    setTempStartDate(null);
    setTempEndDate(null);
    setShowFilterModal(false);
    router.setParams({ place: '' });
    clearFilters();
  };

  const handleRemoveSingleFilter = (key: keyof typeof filters) => {
    if (key === 'placeFilter') {
      router.setParams({ place: '' });
    }
    updateFilters({ [key]: key === 'startDate' || key === 'endDate' ? null : '' });
  };

  const handleRecalculateNetworth = async () => {
    Alert.alert(
      'Recalculate Networth',
      'This will recalculate your networth from all transactions. This may take a moment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              await api.post('/api/finance-management/recalculate-networth/');
              Alert.alert('Success', 'Networth recalculated successfully!');
              updateNetworthWidget();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error || 'Failed to recalculate networth');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Sleek Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>Manage & Track Your Financial History</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale style={styles.iconButton} onPress={handleOpenFilterModal}>
            <Ionicons name="options" size={20} color={ImhotepTheme.colors.textPrimary} />
          </PressableScale>
          <PressableScale
            style={[styles.iconButton, { marginLeft: 8 }]}
            onPress={() => router.push('/(tabs)/scheduled')}
          >
            <Ionicons name="repeat" size={20} color={ImhotepTheme.colors.textPrimary} />
          </PressableScale>
        </View>
      </View>

      {/* Recalculate & Action Bar */}
      <View style={styles.actionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
          <PressableScale style={styles.actionChip} onPress={handleRecalculateNetworth}>
            <Ionicons name="refresh-outline" size={16} color={ImhotepTheme.colors.primaryTealGlow} />
            <Text style={styles.actionText}>Recalculate Balance</Text>
          </PressableScale>
        </ScrollView>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
            <Text style={styles.activeFiltersLabel}>Filters:</Text>
            {filters.startDate && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('startDate')}
              >
                <Text style={styles.activeFilterText}>
                  From: {filters.startDate.toISOString().split('T')[0]}
                </Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            {filters.endDate && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('endDate')}
              >
                <Text style={styles.activeFilterText}>
                  To: {filters.endDate.toISOString().split('T')[0]}
                </Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            {filters.statusFilter && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('statusFilter')}
              >
                <Text style={styles.activeFilterText}>
                  {filters.statusFilter === 'deposit' ? 'Deposits' : 'Withdrawals'}
                </Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            {filters.categoryFilter && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('categoryFilter')}
              >
                <Text style={styles.activeFilterText}>Category: {filters.categoryFilter}</Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            {filters.placeFilter && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('placeFilter')}
              >
                <Text style={styles.activeFilterText}>Place: {filters.placeFilter}</Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            {filters.detailsSearch && (
              <PressableScale
                style={styles.activeFilterChip}
                onPress={() => handleRemoveSingleFilter('detailsSearch')}
              >
                <Text style={styles.activeFilterText}>Search: "{filters.detailsSearch}"</Text>
                <Ionicons name="close-circle" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
              </PressableScale>
            )}
            <PressableScale onPress={handleClearAllFilters} style={styles.clearAllBtn}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </PressableScale>
          </ScrollView>
        </View>
      )}

      {/* Main List / Skeleton / State Views */}
      {loading && transactions.length === 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <TransactionListSkeleton />
        </View>
      ) : error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorCard message={error} onRetry={() => refreshList()} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => {
                setEditTransaction(item);
                setShowAddModal(true);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refreshList()}
              tintColor={ImhotepTheme.colors.primaryTealGlow}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              title="No Transactions Found"
              message={
                hasActiveFilters
                  ? 'No activity matches your active search and filter criteria.'
                  : 'Get started by logging your first transaction.'
              }
              actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Transaction'}
              onAction={
                hasActiveFilters
                  ? handleClearAllFilters
                  : () => {
                      setEditTransaction(null);
                      setShowAddModal(true);
                    }
              }
            />
          }
        />
      )}

      {/* Floating Add Transaction FAB Button */}
      <PressableScale
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
        onPress={() => {
          setEditTransaction(null);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </PressableScale>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        editMode={!!editTransaction}
        initialValues={editTransaction || {}}
        initialType={(editTransaction?.trans_status as any)?.toLowerCase() || 'deposit'}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          refreshList();
        }}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter Transactions</Text>
                  <PressableScale onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={24} color={ImhotepTheme.colors.textPrimary} />
                  </PressableScale>
                </View>

                {/* Status Toggle */}
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.filterChipRow}>
                  {['', 'deposit', 'withdraw'].map((type) => (
                    <PressableScale
                      key={type}
                      style={[
                        styles.modalChip,
                        tempStatus === type && styles.modalChipActive,
                      ]}
                      onPress={() => setTempStatus(type)}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          tempStatus === type && styles.modalChipTextActive,
                        ]}
                      >
                        {type === '' ? 'All' : type === 'deposit' ? 'Income' : 'Expense'}
                      </Text>
                    </PressableScale>
                  ))}
                </View>

                {/* Details Search */}
                <Text style={styles.inputLabel}>Search Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search description..."
                  placeholderTextColor={ImhotepTheme.colors.textMuted}
                  value={tempSearch}
                  onChangeText={setTempSearch}
                />

                {/* Category Select */}
                <Text style={styles.inputLabel}>Category</Text>
                <CategorySelect
                  value={tempCategory}
                  onChange={setTempCategory}
                  status={tempStatus || 'ANY'}
                />

                {/* Place Select */}
                <Text style={styles.inputLabel}>Place</Text>
                <PlaceSelect
                  value={tempPlace}
                  onChange={setTempPlace}
                  currency="ANY"
                />

                {/* Date Filters */}
                <Text style={styles.inputLabel}>Date Range</Text>
                <View style={styles.dateRow}>
                  <PressableScale style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                    <Text style={styles.datePickerText}>
                      {tempStartDate ? tempStartDate.toISOString().split('T')[0] : 'Start Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={ImhotepTheme.colors.textSecondary} />
                  </PressableScale>
                  <PressableScale style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                    <Text style={styles.datePickerText}>
                      {tempEndDate ? tempEndDate.toISOString().split('T')[0] : 'End Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={ImhotepTheme.colors.textSecondary} />
                  </PressableScale>
                </View>

                {showStartPicker && (
                  <DateTimePicker
                    value={tempStartDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      setShowStartPicker(Platform.OS === 'ios');
                      if (d) setTempStartDate(d);
                    }}
                  />
                )}
                {showEndPicker && (
                  <DateTimePicker
                    value={tempEndDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(e, d) => {
                      setShowEndPicker(Platform.OS === 'ios');
                      if (d) setTempEndDate(d);
                    }}
                  />
                )}

                {/* Modal Action Buttons */}
                <View style={styles.modalActions}>
                  <PressableScale style={styles.clearBtn} onPress={handleClearAllFilters}>
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </PressableScale>
                  <PressableScale style={styles.applyBtn} onPress={handleApplyFilters}>
                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                  </PressableScale>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 28,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    paddingVertical: 8,
  },
  actionsScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
  },
  activeFiltersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ImhotepTheme.colors.glassBorder,
  },
  activeFiltersScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: ImhotepTheme.colors.withdrawRed,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ImhotepTheme.colors.backgroundSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 14,
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  modalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  modalChipActive: {
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    borderColor: ImhotepTheme.colors.primaryTealGlow,
  },
  modalChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  modalChipTextActive: {
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  textInput: {
    backgroundColor: ImhotepTheme.colors.inputBackground,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: ImhotepTheme.colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.inputBackground,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 14,
  },
  datePickerText: {
    fontSize: 14,
    color: ImhotepTheme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.withdrawRed,
    alignItems: 'center',
  },
  clearBtnText: {
    color: ImhotepTheme.colors.withdrawRed,
    fontWeight: '700',
    fontSize: 15,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

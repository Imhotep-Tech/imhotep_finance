import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import PressableScale from '@/components/ui/PressableScale';
import SkeletonShimmer from '@/components/ui/SkeletonShimmer';
import { ErrorCard } from '@/components/ui/StateViews';

interface OptionItem {
  label: string;
  value: string;
}

interface FilterModalProps {
  visible: boolean;
  options: OptionItem[];
  onSelect: (val: string) => void;
  onClose: () => void;
  title: string;
  selectedValue: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  options,
  onSelect,
  onClose,
  title,
  selectedValue,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <PressableScale onPress={onClose}>
              <Ionicons name="close" size={22} color={ImhotepTheme.colors.textPrimary} />
            </PressableScale>
          </View>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={true}>
            {options.map((opt) => (
              <PressableScale
                key={opt.value}
                style={[
                  styles.optionItem,
                  selectedValue === opt.value && styles.optionItemActive,
                ]}
                onPress={() => onSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedValue === opt.value && styles.optionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {selectedValue === opt.value && (
                  <Ionicons name="checkmark-circle" size={20} color={ImhotepTheme.colors.primaryTealGlow} />
                )}
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();

  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [viewBy, setViewBy] = useState<'category' | 'place'>('category');
  const [netWorthByPlace, setNetWorthByPlace] = useState<any[]>([]);
  const [netWorthLoading, setNetWorthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [error, setError] = useState('');
  const [favoriteCurrency, setFavoriteCurrency] = useState('USD');

  // History Options
  const [historicalMonths, setHistoricalMonths] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [reportData, setReportData] = useState<any>(null);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const fetchNetWorthByPlace = async () => {
    setNetWorthLoading(true);
    try {
      const res = await api.get('/api/finance-management/get-networth-by-place/');
      setNetWorthByPlace(res.data.networth_by_place || []);
    } catch (err) {
      console.warn('Failed to fetch net worth by place:', err);
      setNetWorthByPlace([]);
    } finally {
      setNetWorthLoading(false);
    }
  };

  useEffect(() => {
    if (viewBy === 'place') {
      fetchNetWorthByPlace();
    }
  }, [viewBy, favoriteCurrency]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      try {
        const currencyRes = await api.get('/api/get-fav-currency/');
        setFavoriteCurrency(currencyRes.data.favorite_currency || 'USD');
      } catch (e) {
        console.warn('Failed to fetch currency');
      }

      const monthsRes = await api.get('/api/finance-management/get-report-history-months/');
      const months = monthsRes.data.report_history_months || [];
      setHistoricalMonths(months);

      const yearsRes = await api.get('/api/finance-management/get-report-history-years/');
      const years = yearsRes.data.report_history_years || [new Date().getFullYear()];
      setAvailableYears(years);

      const now = new Date();
      const currentM = now.getMonth() + 1;
      const currentY = now.getFullYear();

      const currentMonthExists = months.some((m: any) => m.month === currentM && m.year === currentY);
      if (currentMonthExists) {
        setSelectedMonth(`${currentM}-${currentY}`);
      } else if (months.length > 0) {
        setSelectedMonth(`${months[0].month}-${months[0].year}`);
      }

      setSelectedYear(currentY.toString());
    } catch (err) {
      console.error('Initial load error:', err);
      setError('Failed to load initial report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchReportData();
    }
  }, [selectedMonth, selectedYear, reportType]);

  const fetchReportData = async () => {
    if (reportType === 'monthly' && !selectedMonth) return;
    if (reportType === 'yearly' && !selectedYear) return;

    setDataLoading(true);
    setError('');

    try {
      let res;
      if (reportType === 'monthly') {
        const [m, y] = selectedMonth.split('-');
        res = await api.get(`/api/finance-management/get-monthly-report-history/?month=${m}&year=${y}`);
        setReportData(res.data.report_data || res.data);
      } else {
        res = await api.get(`/api/finance-management/get-yearly-report/?year=${selectedYear}`);
        setReportData(res.data.report_data || res.data);
      }

      const newCurr =
        res.data.favorite_currency ||
        res.data.report_data?.favorite_currency ||
        favoriteCurrency;
      if (newCurr !== favoriteCurrency) setFavoriteCurrency(newCurr);

      if (viewBy === 'place') {
        fetchNetWorthByPlace();
      }
    } catch (err: any) {
      console.error('Report fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleRecalculate = async () => {
    Alert.alert(
      'Recalculate Reports',
      'This will recalculate all monthly financial reports. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setRecalculateLoading(true);
            try {
              const response = await api.post('/api/finance-management/recalculate-reports/');
              const summary = response.data.summary;
              Alert.alert(
                'Success',
                `Processed: ${summary.total_months_processed}\nCreated: ${summary.months_created}\nUpdated: ${summary.months_updated}`
              );
              loadInitialData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Recalculation failed');
            } finally {
              setRecalculateLoading(false);
            }
          },
        },
      ]
    );
  };

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const monthOptions: OptionItem[] = historicalMonths.map((m) => ({
    label: `${getMonthName(m.month)} ${m.year}`,
    value: `${m.month}-${m.year}`,
  }));

  const yearOptions: OptionItem[] = availableYears.map((y) => ({
    label: y.toString(),
    value: y.toString(),
  }));

  const formatCurrency = (amount: number) => {
    return `${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${favoriteCurrency}`;
  };

  // Web API Payload Mapping
  const totalIncome = reportData?.total_deposit ?? reportData?.total_deposits ?? 0;
  const totalExpense = reportData?.total_withdraw ?? reportData?.total_withdrawals ?? 0;
  const netSavings = reportData?.net_savings ?? (totalIncome - totalExpense);

  const withdrawCategories: any[] = reportData?.user_withdraw_on_range || [];
  const depositCategories: any[] = reportData?.user_deposit_on_range || [];
  const withdrawPlaces: any[] = reportData?.user_withdraw_by_place || [];
  const depositPlaces: any[] = reportData?.user_deposit_by_place || [];

  const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressBar,
          { backgroundColor: color, width: `${Math.max(percentage, 2)}%` },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sleek Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Analytics & Reports</Text>
          <Text style={styles.headerSubtitle}>Financial Breakdown & Vault Metrics</Text>
        </View>

        <PressableScale style={styles.recalculateBtn} onPress={handleRecalculate} disabled={recalculateLoading}>
          <Ionicons name="refresh" size={18} color={ImhotepTheme.colors.primaryTealGlow} />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={dataLoading}
            onRefresh={fetchReportData}
            tintColor={ImhotepTheme.colors.primaryTealGlow}
          />
        }
      >
        {/* Toggle Report Type (Monthly vs Yearly) */}
        <View style={styles.tabContainer}>
          <PressableScale
            style={[styles.tabButton, reportType === 'monthly' && styles.tabButtonActive]}
            onPress={() => setReportType('monthly')}
          >
            <Text style={[styles.tabText, reportType === 'monthly' && styles.tabTextActive]}>
              Monthly
            </Text>
          </PressableScale>

          <PressableScale
            style={[styles.tabButton, reportType === 'yearly' && styles.tabButtonActive]}
            onPress={() => setReportType('yearly')}
          >
            <Text style={[styles.tabText, reportType === 'yearly' && styles.tabTextActive]}>
              Yearly
            </Text>
          </PressableScale>
        </View>

        {/* Date Selector Pills */}
        <View style={styles.selectorRow}>
          {reportType === 'monthly' ? (
            <PressableScale
              style={styles.selectorPill}
              onPress={() => setShowMonthSelector(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={ImhotepTheme.colors.primaryTealGlow} />
              <Text style={styles.selectorText}>
                {selectedMonth
                  ? `${getMonthName(parseInt(selectedMonth.split('-')[0]))} ${
                      selectedMonth.split('-')[1]
                    }`
                  : 'Select Month'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={ImhotepTheme.colors.textSecondary} />
            </PressableScale>
          ) : (
            <PressableScale
              style={styles.selectorPill}
              onPress={() => setShowYearSelector(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={ImhotepTheme.colors.primaryTealGlow} />
              <Text style={styles.selectorText}>Year: {selectedYear || 'Select Year'}</Text>
              <Ionicons name="chevron-down" size={16} color={ImhotepTheme.colors.textSecondary} />
            </PressableScale>
          )}

          {/* View By Category vs Place Toggle */}
          <View style={styles.viewByToggle}>
            <PressableScale
              style={[styles.viewByBtn, viewBy === 'category' && styles.viewByBtnActive]}
              onPress={() => setViewBy('category')}
            >
              <Text style={[styles.viewByText, viewBy === 'category' && styles.viewByTextActive]}>
                Category
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.viewByBtn, viewBy === 'place' && styles.viewByBtnActive]}
              onPress={() => setViewBy('place')}
            >
              <Text style={[styles.viewByText, viewBy === 'place' && styles.viewByTextActive]}>
                Place
              </Text>
            </PressableScale>
          </View>
        </View>

        {/* Content Section */}
        {dataLoading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonShimmer height={140} borderRadius={20} style={{ marginBottom: 14 }} />
            <SkeletonShimmer height={200} borderRadius={20} />
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchReportData} />
        ) : reportData ? (
          <View style={styles.metricsGrid}>
            {/* Totals Bento Card */}
            <View style={styles.bentoCard}>
              <Text style={styles.cardTitle}>Financial Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Income</Text>
                  <Text style={[styles.statAmount, { color: ImhotepTheme.colors.depositGreen }]}>
                    {formatCurrency(totalIncome)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Expenses</Text>
                  <Text style={[styles.statAmount, { color: ImhotepTheme.colors.withdrawRed }]}>
                    {formatCurrency(totalExpense)}
                  </Text>
                </View>
              </View>

              <View style={styles.netBox}>
                <Text style={styles.netLabel}>Net Cash Flow</Text>
                <Text
                  style={[
                    styles.netAmount,
                    {
                      color:
                        netSavings >= 0
                          ? ImhotepTheme.colors.depositGreen
                          : ImhotepTheme.colors.withdrawRed,
                    },
                  ]}
                >
                  {formatCurrency(netSavings)}
                </Text>
              </View>
            </View>

            {/* Category Breakdown (Income & Expenses) */}
            {viewBy === 'category' ? (
              <>
                {/* Expenses by Category */}
                <View style={styles.bentoCard}>
                  <Text style={styles.cardTitle}>Expenses by Category</Text>
                  {withdrawCategories.length > 0 ? (
                    withdrawCategories.map((cat: any, index: number) => {
                      const amountVal = cat.converted_amount ?? cat.amount ?? 0;
                      const percentage = parseFloat(cat.percentage || 0) || (totalExpense > 0 ? (amountVal / totalExpense) * 100 : 0);
                      return (
                        <View key={index} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownName}>{cat.category}</Text>
                            <Text style={styles.breakdownAmount}>
                              {formatCurrency(amountVal)} ({percentage.toFixed(1)}%)
                            </Text>
                          </View>
                          <ProgressBar percentage={percentage} color={ImhotepTheme.colors.withdrawRed} />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No expense activity recorded for this period.</Text>
                  )}
                </View>

                {/* Income by Category */}
                <View style={styles.bentoCard}>
                  <Text style={styles.cardTitle}>Income by Category</Text>
                  {depositCategories.length > 0 ? (
                    depositCategories.map((cat: any, index: number) => {
                      const amountVal = cat.converted_amount ?? cat.amount ?? 0;
                      const percentage = parseFloat(cat.percentage || 0) || (totalIncome > 0 ? (amountVal / totalIncome) * 100 : 0);
                      return (
                        <View key={index} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownName}>{cat.category}</Text>
                            <Text style={styles.breakdownAmount}>
                              {formatCurrency(amountVal)} ({percentage.toFixed(1)}%)
                            </Text>
                          </View>
                          <ProgressBar percentage={percentage} color={ImhotepTheme.colors.depositGreen} />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No income activity recorded for this period.</Text>
                  )}
                </View>
              </>
            ) : (
              /* Place Breakdown (Expenses & Income & Vault Balances) */
              <>
                <View style={styles.bentoCard}>
                  <Text style={styles.cardTitle}>Expenses by Location / Vault</Text>
                  {withdrawPlaces.length > 0 ? (
                    withdrawPlaces.map((placeItem: any, index: number) => {
                      const amountVal = placeItem.converted_amount ?? placeItem.amount ?? 0;
                      const percentage = parseFloat(placeItem.percentage || 0) || (totalExpense > 0 ? (amountVal / totalExpense) * 100 : 0);
                      return (
                        <View key={index} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownName}>{placeItem.place}</Text>
                            <Text style={styles.breakdownAmount}>
                              {formatCurrency(amountVal)} ({percentage.toFixed(1)}%)
                            </Text>
                          </View>
                          <ProgressBar percentage={percentage} color={ImhotepTheme.colors.withdrawRed} />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No location expense activity recorded.</Text>
                  )}
                </View>

                <View style={styles.bentoCard}>
                  <Text style={styles.cardTitle}>Income by Location / Vault</Text>
                  {depositPlaces.length > 0 ? (
                    depositPlaces.map((placeItem: any, index: number) => {
                      const amountVal = placeItem.converted_amount ?? placeItem.amount ?? 0;
                      const percentage = parseFloat(placeItem.percentage || 0) || (totalIncome > 0 ? (amountVal / totalIncome) * 100 : 0);
                      return (
                        <View key={index} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownName}>{placeItem.place}</Text>
                            <Text style={styles.breakdownAmount}>
                              {formatCurrency(amountVal)} ({percentage.toFixed(1)}%)
                            </Text>
                          </View>
                          <ProgressBar percentage={percentage} color={ImhotepTheme.colors.depositGreen} />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No location income activity recorded.</Text>
                  )}
                </View>

                <View style={styles.bentoCard}>
                  <Text style={styles.cardTitle}>Net Worth Balances by Place</Text>
                  {netWorthLoading ? (
                    <SkeletonShimmer height={120} borderRadius={14} />
                  ) : netWorthByPlace && netWorthByPlace.length > 0 ? (
                    netWorthByPlace.map((place: any, index: number) => {
                      const amountVal = place.converted_amount ?? place.networth ?? 0;
                      return (
                        <View key={index} style={styles.breakdownItem}>
                          <View style={styles.breakdownHeader}>
                            <Text style={styles.breakdownName}>{place.place}</Text>
                            <Text style={styles.breakdownAmount}>{formatCurrency(amountVal)}</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>No vault balances recorded.</Text>
                  )}
                </View>
              </>
            )}
          </View>
        ) : null}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Filter Modals */}
      <FilterModal
        visible={showMonthSelector}
        options={monthOptions}
        onSelect={(val) => {
          setSelectedMonth(val);
          setShowMonthSelector(false);
        }}
        onClose={() => setShowMonthSelector(false)}
        title="Select Month"
        selectedValue={selectedMonth}
      />

      <FilterModal
        visible={showYearSelector}
        options={yearOptions}
        onSelect={(val) => {
          setSelectedYear(val);
          setShowYearSelector(false);
        }}
        onClose={() => setShowYearSelector(false)}
        title="Select Year"
        selectedValue={selectedYear}
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
  recalculateBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
  },
  viewByToggle: {
    flexDirection: 'row',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 16,
    padding: 3,
  },
  viewByBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewByBtnActive: {
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
  },
  viewByText: {
    fontSize: 12,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  viewByTextActive: {
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  skeletonContainer: {
    paddingVertical: 12,
  },
  metricsGrid: {
    gap: 16,
  },
  bentoCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: ImhotepTheme.colors.textSecondary,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  netBox: {
    borderTopWidth: 1,
    borderTopColor: ImhotepTheme.colors.glassBorder,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
  },
  netAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  breakdownItem: {
    marginBottom: 14,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownName: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: ImhotepTheme.colors.textSecondary,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 13,
    color: ImhotepTheme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
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
    borderTopWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: ImhotepTheme.colors.glassBorder,
  },
  optionItemActive: {
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
  },
  optionText: {
    fontSize: 15,
    color: ImhotepTheme.colors.textPrimary,
  },
  optionTextActive: {
    color: ImhotepTheme.colors.primaryTealGlow,
    fontWeight: '700',
  },
});

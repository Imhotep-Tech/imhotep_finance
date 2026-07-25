import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import { currencies as allCurrencies } from '@/constants/currencies';
import PressableScale from '@/components/ui/PressableScale';
import SkeletonShimmer from '@/components/ui/SkeletonShimmer';
import CurrencySelect from '@/components/CurrencySelect';
import PlaceSelect from '@/components/PlaceSelect';
import { EmptyState } from '@/components/ui/StateViews';

interface NetWorthDetail {
  currency: string;
  amount: number;
}

export default function NetWorthDetailsScreen() {
  const insets = useSafeAreaInsets();

  const [viewType, setViewType] = useState<'place' | 'currency'>('place');
  const [details, setDetails] = useState<Record<string, NetWorthDetail[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Move Money state
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [sourcePlace, setSourcePlace] = useState<string>('');
  const [targetPlace, setTargetPlace] = useState<string>('');
  const [targetPlaceInput, setTargetPlaceInput] = useState<string>('');
  const [isCustomTarget, setIsCustomTarget] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Convert Currency state
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [convertPlace, setConvertPlace] = useState<string>('');
  const [sourceCurrency, setSourceCurrency] = useState<string>('');
  const [targetCurrency, setTargetCurrency] = useState<string>('');
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [convertSubmitting, setConvertSubmitting] = useState<boolean>(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

  const fetchDetails = async () => {
    try {
      const res = await api.get('/api/finance-management/get-networth-details/');
      const data = res.data.networth_details;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setDetails(data as any);
      } else {
        setDetails({});
      }
    } catch (err) {
      console.error('Failed to fetch net worth details:', err);
      setDetails({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    api
      .get('/api/finance-management/get-exchange-rates/')
      .then((res) => setExchangeRates(res.data))
      .catch(() => console.error('Failed to load exchange rates'));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const getCurrencyGroupedDetails = () => {
    const currencyGroups: Record<
      string,
      { total: number; places: { place: string; amount: number; percentage: number }[] }
    > = {};

    Object.entries(details).forEach(([place, currencies]) => {
      currencies.forEach((item) => {
        const cur = item.currency;
        const amt = Number(item.amount || 0);
        if (!currencyGroups[cur]) {
          currencyGroups[cur] = { total: 0, places: [] };
        }
        currencyGroups[cur].total += amt;
        currencyGroups[cur].places.push({ place, amount: amt, percentage: 0 });
      });
    });

    Object.keys(currencyGroups).forEach((cur) => {
      const group = currencyGroups[cur];
      group.places = group.places.map((p) => {
        const pct = group.total > 0 ? (p.amount / group.total) * 100 : 0;
        return { ...p, percentage: pct };
      });
      group.places.sort((a, b) => b.amount - a.amount);
    });

    return Object.entries(currencyGroups);
  };

  const handleMoveSubmit = async () => {
    const finalTarget = isCustomTarget ? targetPlaceInput.trim() : targetPlace;
    if (!sourcePlace || !currency || !finalTarget || !amount) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (sourcePlace.toLowerCase().trim() === finalTarget.toLowerCase().trim()) {
      Alert.alert('Error', 'Source and target places must be different.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Amount must be greater than zero.');
      return;
    }

    const maxAvailable =
      (details[sourcePlace] || []).find((item) => item.currency === currency)?.amount || 0;
    if (parsedAmount > maxAvailable) {
      Alert.alert(
        'Error',
        `Insufficient funds in ${sourcePlace}. Maximum available is ${maxAvailable} ${currency}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/finance-management/move-money/', {
        source_place: sourcePlace,
        target_place: finalTarget,
        amount: parsedAmount,
        currency,
      });
      setShowMoveModal(false);
      Alert.alert('Success', 'Money moved successfully!');
      fetchDetails();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'An error occurred during transfer.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDefaultRate = (src: string, tgt: string) => {
    if (src && tgt && exchangeRates) {
      const srcRate = exchangeRates[src];
      const tgtRate = exchangeRates[tgt];
      if (srcRate && tgtRate) {
        const rate = (tgtRate / srcRate).toFixed(6);
        setExchangeRate(rate);
        const parsedAmount = parseFloat(convertAmount);
        if (!isNaN(parsedAmount)) {
          setTargetAmount((parsedAmount * parseFloat(rate)).toFixed(2));
        }
        return;
      }
    }
    setExchangeRate('');
    setTargetAmount('');
  };

  const handleConvertAmountChange = (val: string) => {
    setConvertAmount(val);
    const parsedVal = parseFloat(val);
    const parsedRate = parseFloat(exchangeRate);
    if (!isNaN(parsedVal) && !isNaN(parsedRate) && parsedRate > 0) {
      setTargetAmount((parsedVal * parsedRate).toFixed(2));
    } else {
      setTargetAmount('');
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setExchangeRate(val);
    const parsedAmount = parseFloat(convertAmount);
    const parsedRate = parseFloat(val);
    if (!isNaN(parsedAmount) && !isNaN(parsedRate) && parsedRate > 0) {
      setTargetAmount((parsedAmount * parsedRate).toFixed(2));
    }
  };

  const handleTargetAmountChange = (val: string) => {
    setTargetAmount(val);
    const parsedTarget = parseFloat(val);
    const parsedAmount = parseFloat(convertAmount);
    if (!isNaN(parsedTarget) && !isNaN(parsedAmount) && parsedAmount > 0) {
      setExchangeRate((parsedTarget / parsedAmount).toFixed(6));
    }
  };

  const handleConvertSubmit = async () => {
    if (!convertPlace || !sourceCurrency || !targetCurrency || !convertAmount || !targetAmount) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (sourceCurrency === targetCurrency) {
      Alert.alert('Error', 'Source and target currencies must be different.');
      return;
    }

    const parsedAmount = parseFloat(convertAmount);
    const parsedTargetAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      Alert.alert('Error', 'Amounts must be greater than zero.');
      return;
    }

    const maxAvailable =
      (details[convertPlace] || []).find((item) => item.currency === sourceCurrency)?.amount || 0;
    if (parsedAmount > maxAvailable) {
      Alert.alert(
        'Error',
        `Insufficient funds. Maximum available is ${maxAvailable} ${sourceCurrency}.`
      );
      return;
    }

    setConvertSubmitting(true);
    try {
      await api.post('/api/finance-management/convert-currency/', {
        place: convertPlace,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        amount: parsedAmount,
        target_amount: parsedTargetAmount,
      });
      setShowConvertModal(false);
      Alert.alert('Success', 'Currency converted successfully!');
      fetchDetails();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'An error occurred during conversion.';
      Alert.alert('Error', errorMessage);
    } finally {
      setConvertSubmitting(false);
    }
  };

  const handleDeleteNetWorth = (place: string, curr: string, currentAmount?: number) => {
    if (currentAmount !== undefined && Number(currentAmount) !== 0) {
      Alert.alert('Cannot Delete', 'Only net worth records with a balance of 0 can be deleted.');
      return;
    }
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the ${curr} net worth record at ${place}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/finance-management/delete-networth/', {
                data: { place, currency: curr },
              });
              Alert.alert('Success', 'Net worth record deleted successfully!');
              fetchDetails();
            } catch (err: any) {
              const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.detail ||
                'An error occurred while deleting net worth record.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const placesList = Object.keys(details);
  const currencyGroupedList = getCurrencyGroupedDetails();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Net Worth Vault',
          headerStyle: { backgroundColor: ImhotepTheme.colors.backgroundSurface },
          headerTintColor: ImhotepTheme.colors.textPrimary,
          headerShadowVisible: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Net Worth Details</Text>
          <Text style={styles.headerSubtitle}>Asset Allocation & Vault Liquidity</Text>
        </View>
        <View style={styles.actionRow}>
          <PressableScale
            style={styles.actionBtn}
            onPress={() => {
              setSourcePlace('');
              setTargetPlace('');
              setTargetPlaceInput('');
              setIsCustomTarget(false);
              setCurrency('');
              setAmount('');
              setShowMoveModal(true);
            }}
          >
            <Ionicons name="swap-horizontal" size={16} color={ImhotepTheme.colors.primaryTealGlow} />
            <Text style={styles.actionBtnText}>Move</Text>
          </PressableScale>

          <PressableScale
            style={styles.actionBtn}
            onPress={() => {
              setConvertPlace('');
              setSourceCurrency('');
              setTargetCurrency('');
              setConvertAmount('');
              setTargetAmount('');
              setExchangeRate('');
              setShowConvertModal(true);
            }}
          >
            <Ionicons name="repeat" size={16} color={ImhotepTheme.colors.accentGoldGlow} />
            <Text style={styles.actionBtnText}>Convert</Text>
          </PressableScale>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ImhotepTheme.colors.primaryTealGlow}
          />
        }
      >
        {/* Toggle Selector: By Place vs By Currency */}
        <View style={styles.toggleContainer}>
          <PressableScale
            style={[styles.toggleBtn, viewType === 'place' && styles.toggleBtnActive]}
            onPress={() => setViewType('place')}
          >
            <Text style={[styles.toggleText, viewType === 'place' && styles.toggleTextActive]}>
              By Place
            </Text>
          </PressableScale>
          <PressableScale
            style={[styles.toggleBtn, viewType === 'currency' && styles.toggleBtnActive]}
            onPress={() => setViewType('currency')}
          >
            <Text style={[styles.toggleText, viewType === 'currency' && styles.toggleTextActive]}>
              By Currency
            </Text>
          </PressableScale>
        </View>

        {/* Loading Shimmers */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <SkeletonShimmer height={120} borderRadius={20} style={{ marginBottom: 12 }} />
            <SkeletonShimmer height={120} borderRadius={20} />
          </View>
        ) : viewType === 'place' ? (
          placesList.length > 0 ? (
            placesList.map((place) => {
              const placeCurrencies = details[place] || [];
              const placeTotalUSD = placeCurrencies.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
              );

              return (
                <View key={place} style={styles.bentoCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.placeTitleRow}>
                      <Ionicons name="wallet-outline" size={20} color={ImhotepTheme.colors.primaryTealGlow} />
                      <Text style={styles.cardTitle}>{place}</Text>
                    </View>
                    <PressableScale
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/transactions',
                          params: { place },
                        })
                      }
                      style={styles.viewTransBtn}
                    >
                      <Text style={styles.viewTransText}>View Transactions</Text>
                      <Ionicons name="chevron-forward" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
                    </PressableScale>
                  </View>

                  <View style={styles.currenciesList}>
                    {placeCurrencies.map((item) => (
                      <View key={item.currency} style={styles.currencyRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.currencyCode}>{item.currency}</Text>
                        </View>
                        <Text style={styles.currencyAmount}>
                          {Number(item.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          {item.currency}
                        </Text>
                        {Number(item.amount || 0) === 0 ? (
                          <PressableScale
                            onPress={() => handleDeleteNetWorth(place, item.currency, Number(item.amount || 0))}
                            style={styles.deleteIconBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={ImhotepTheme.colors.withdrawRed} />
                          </PressableScale>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              title="No Net Worth Records"
              message="Add transactions to populate your net worth balances across places."
            />
          )
        ) : (
          /* View By Currency */
          currencyGroupedList.length > 0 ? (
            currencyGroupedList.map(([cur, group]) => (
              <View key={cur} style={styles.bentoCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{cur} Holdings</Text>
                  <Text style={styles.totalBadge}>
                    Total: {group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {cur}
                  </Text>
                </View>

                <View style={styles.currenciesList}>
                  {group.places.map((p) => (
                    <View key={p.place} style={styles.currencyRow}>
                      <Text style={styles.placeName}>{p.place}</Text>
                      <Text style={styles.currencyAmount}>
                        {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {cur}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <EmptyState title="No Holdings Found" message="No currency balances found." />
          )
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Move Money Modal */}
      <Modal visible={showMoveModal} animationType="slide" transparent={true} onRequestClose={() => setShowMoveModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move Money Between Vaults</Text>
              <PressableScale onPress={() => setShowMoveModal(false)}>
                <Ionicons name="close" size={22} color={ImhotepTheme.colors.textPrimary} />
              </PressableScale>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Source Place</Text>
              <PlaceSelect value={sourcePlace} onChange={setSourcePlace} />

              <Text style={styles.label}>Target Place</Text>
              <PlaceSelect
                value={isCustomTarget ? 'custom' : targetPlace}
                onChange={(val) => {
                  if (val === 'custom') {
                    setIsCustomTarget(true);
                  } else {
                    setIsCustomTarget(false);
                    setTargetPlace(val);
                  }
                }}
              />

              {isCustomTarget && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Enter new target place..."
                  placeholderTextColor={ImhotepTheme.colors.textMuted}
                  value={targetPlaceInput}
                  onChangeText={setTargetPlaceInput}
                />
              )}

              <Text style={styles.label}>Currency</Text>
              <CurrencySelect value={currency} onChange={setCurrency} />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={ImhotepTheme.colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <PressableScale style={styles.modalSubmitBtn} onPress={handleMoveSubmit} disabled={submitting}>
                <Text style={styles.modalSubmitBtnText}>Execute Transfer</Text>
              </PressableScale>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Convert Currency Modal */}
      <Modal visible={showConvertModal} animationType="slide" transparent={true} onRequestClose={() => setShowConvertModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Convert Currency</Text>
              <PressableScale onPress={() => setShowConvertModal(false)}>
                <Ionicons name="close" size={22} color={ImhotepTheme.colors.textPrimary} />
              </PressableScale>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Location / Place</Text>
              <PlaceSelect value={convertPlace} onChange={setConvertPlace} />

              <Text style={styles.label}>From Currency</Text>
              <CurrencySelect
                value={sourceCurrency}
                onChange={(val) => {
                  setSourceCurrency(val);
                  updateDefaultRate(val, targetCurrency);
                }}
              />

              <Text style={styles.label}>To Currency</Text>
              <CurrencySelect
                value={targetCurrency}
                onChange={(val) => {
                  setTargetCurrency(val);
                  updateDefaultRate(sourceCurrency, val);
                }}
              />

              <Text style={styles.label}>Source Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={ImhotepTheme.colors.textMuted}
                keyboardType="numeric"
                value={convertAmount}
                onChangeText={handleConvertAmountChange}
              />

              <Text style={styles.label}>Exchange Rate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1.25"
                placeholderTextColor={ImhotepTheme.colors.textMuted}
                keyboardType="numeric"
                value={exchangeRate}
                onChangeText={handleExchangeRateChange}
              />

              <Text style={styles.label}>Converted Target Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={ImhotepTheme.colors.textMuted}
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={handleTargetAmountChange}
              />

              <PressableScale style={styles.modalSubmitBtn} onPress={handleConvertSubmit} disabled={convertSubmitting}>
                <Text style={styles.modalSubmitBtnText}>Confirm Conversion</Text>
              </PressableScale>
            </ScrollView>
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
    fontSize: 24,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  skeletonContainer: {
    paddingVertical: 12,
  },
  bentoCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  viewTransBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewTransText: {
    fontSize: 12,
    fontWeight: '600',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  totalBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  currenciesList: {
    gap: 10,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ImhotepTheme.colors.glassBorder,
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
  },
  currencyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    marginRight: 10,
  },
  deleteIconBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: ImhotepTheme.colors.inputBackground,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: ImhotepTheme.colors.textPrimary,
  },
  modalSubmitBtn: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

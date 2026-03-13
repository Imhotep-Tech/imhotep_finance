import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';
import AddTransactionModal from '@/components/AddTransactionModal';

type WidgetState = {
  favoriteCurrency: string;
  networth: string;
  score: number | null;
  isLoading: boolean;
  hasError: boolean;
};

const DEFAULT_STATE: WidgetState = {
  favoriteCurrency: 'USD',
  networth: '0',
  score: null,
  isLoading: true,
  hasError: false,
};

const getScoreColor = (score: number | null) => {
  if (score === null) return '#f59e0b';
  if (score > 0) return '#10b981';
  if (score < 0) return '#ef4444';
  return '#f59e0b';
};

export default function NetworthWidgetTestScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [state, setState] = useState<WidgetState>(DEFAULT_STATE);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'withdraw'>('deposit');

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, hasError: false }));

    try {
      // 1. Networth + favorite currency
      const networthRes = await api.get('/api/finance-management/get-networth/');
      const networth = String(networthRes.data.networth || '0');
      const favoriteCurrency = networthRes.data.favorite_currency || 'USD';

      // 2. Score (optional)
      let score: number | null = null;
      try {
        const scoreRes = await api.get('/api/finance-management/target/get-score/');
        if (scoreRes.data.score_txt) {
          score = Number(scoreRes.data.score ?? null);
        }
      } catch {
        score = null;
      }

      setState({
        favoriteCurrency,
        networth,
        score,
        isLoading: false,
        hasError: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, hasError: true }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { favoriteCurrency, networth, score, isLoading, hasError } = state;
  const scoreColor = getScoreColor(score);
  const scoreLabel =
    score === null ? 'No score' : `${score > 0 ? '+' : ''}${score.toFixed(0)} ${favoriteCurrency}`;

  const mainText = hasError
    ? 'Could not load net worth'
    : `${Number(networth || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${favoriteCurrency}`;

  const subtitle = hasError ? 'Tap reload to try again' : 'Total Net Worth';

  const bg = isDark ? '#020617' : '#e5e7eb';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Net Worth Widget Test',
        }}
      />
      <ScrollView contentContainerStyle={[styles.root, { backgroundColor: bg }]}>
        <Text style={styles.info}>
          This screen simulates the Android home widget so you can test logic and API responses in
          Expo Go. The real widget uses the same endpoints and behavior.
        </Text>

        <View style={styles.widgetOuter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.widgetContainer}
            onPress={() => router.push('/show-networth-details')}
          >
            <View style={styles.widgetTopRow}>
              <View style={styles.widgetLeftColumn}>
                <View style={styles.widgetHeader}>
                  <Text style={styles.widgetTitle}>Total Net Worth</Text>
                  {isLoading && <ActivityIndicator size="small" color="#cbd5f5" />}
                </View>

                <Text style={styles.widgetMain}>{mainText}</Text>
                <Text style={styles.widgetSubtitle}>{subtitle}</Text>
              </View>

              <View style={styles.widgetRightColumn}>
                <TouchableOpacity style={styles.reloadBtn} onPress={fetchData}>
                  <Ionicons name="refresh" size={16} color="#f9fafb" />
                  <Text style={styles.reloadText}>Reload</Text>
                </TouchableOpacity>

                <View style={styles.scorePill}>
                  <Text style={styles.scoreLabel}>Score</Text>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>{scoreLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.widgetActionsRow}>
              <TouchableOpacity
                style={[styles.widgetActionBigBtn, styles.depositBigBtn]}
                onPress={() => {
                  setInitialType('deposit');
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="add" size={18} color="#10b981" />
                <Text style={styles.depositBigText}>Deposit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.widgetActionBigBtn, styles.withdrawBigBtn]}
                onPress={() => {
                  setInitialType('withdraw');
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="remove" size={18} color="#ef4444" />
                <Text style={styles.withdrawBigText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddTransactionModal
        visible={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchData();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  info: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  widgetOuter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  widgetContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  widgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  widgetLeftColumn: {
    flex: 1,
    marginRight: 8,
  },
  widgetRightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  widgetTitle: {
    fontSize: 12,
    color: 'rgba(248, 250, 252, 0.7)',
    fontWeight: '500',
  },
  widgetMain: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
  },
  widgetSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.9)',
  },
  widgetActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  widgetActionBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    flex: 1,
    gap: 6,
  },
  depositBigBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  withdrawBigBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  depositBigText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  withdrawBigText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
  },
  scoreLabel: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.9)',
  },
  scoreValue: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#366c6b',
    gap: 4,
  },
  reloadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f9fafb',
  },
});


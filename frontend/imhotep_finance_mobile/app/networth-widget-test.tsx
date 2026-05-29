import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AddTransactionModal from '@/components/AddTransactionModal';

export default function NetworthWidgetTestScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'withdraw'>('deposit');

  const bg = isDark ? '#020617' : '#e5e7eb';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Secure Widget Test',
        }}
      />
      <ScrollView contentContainerStyle={[styles.root, { backgroundColor: bg }]}>
        <Text style={styles.info}>
          This screen simulates the secure Android home widget so you can test shortcuts and deep links inside Expo Go.
        </Text>

        <Text style={styles.widgetLabel}>Secure Shortcuts Widget (4x1)</Text>
        <View style={styles.widgetOuter}>
          <View style={styles.shortcutsWidgetContainer}>
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
              style={[styles.widgetActionBigBtn, styles.networthMiddleBtn]}
              onPress={() => {
                router.push('/show-networth-details');
              }}
            >
              <Text style={styles.networthMiddleText}>Net Worth</Text>
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
        </View>
      </ScrollView>

      <AddTransactionModal
        visible={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
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
  widgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  widgetOuter: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  shortcutsWidgetContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
  networthMiddleBtn: {
    backgroundColor: '#366c6b',
    flex: 1.2,
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
  networthMiddleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f9fafb',
  },
});

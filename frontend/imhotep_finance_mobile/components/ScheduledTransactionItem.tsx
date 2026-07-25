import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from '@/components/ui/PressableScale';

export interface ScheduledTransaction {
  id: number;
  amount: string | number;
  currency: string;
  category: string;
  place?: string;
  scheduled_trans_status: string;
  scheduled_trans_details: string;
  day_of_month: number;
  status: boolean;
}

interface ScheduledTransactionItemProps {
  transaction: ScheduledTransaction;
  onPress: () => void;
  onToggleStatus: () => void;
  loading?: boolean;
}

export const ScheduledTransactionItem: React.FC<ScheduledTransactionItemProps> = ({
  transaction,
  onPress,
  onToggleStatus,
  loading = false,
}) => {
  const isDeposit = String(transaction.scheduled_trans_status).toLowerCase() === 'deposit';

  const formattedAmount = Number(transaction.amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const amountColor = isDeposit
    ? ImhotepTheme.colors.depositGreen
    : ImhotepTheme.colors.withdrawRed;

  const iconBg = isDeposit
    ? ImhotepTheme.colors.depositGreenLight
    : ImhotepTheme.colors.withdrawRedLight;

  return (
    <PressableScale onPress={onPress} style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons
          name={isDeposit ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={amountColor}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={styles.category} numberOfLines={1}>
            {transaction.category || 'General'}
            {transaction.place && transaction.place !== 'General' ? ` • ${transaction.place}` : ''}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isDeposit ? '+' : '-'} {formattedAmount} {transaction.currency}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.details} numberOfLines={1}>
            {transaction.scheduled_trans_details || 'No Description'}
          </Text>

          <View style={styles.statusContainer}>
            <Text style={styles.dayText}>Day {transaction.day_of_month}</Text>
            <PressableScale
              onPress={(e: any) => {
                e?.stopPropagation?.();
                onToggleStatus();
              }}
              disabled={loading}
              style={[
                styles.statusBadge,
                transaction.status ? styles.activeBadgeBg : styles.inactiveBadgeBg,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: transaction.status
                      ? ImhotepTheme.colors.depositGreen
                      : ImhotepTheme.colors.textMuted,
                  },
                ]}
              >
                {loading ? '...' : transaction.status ? 'Active' : 'Paused'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 18,
    minHeight: 64,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 15,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  details: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  dayText: {
    fontSize: 12,
    color: ImhotepTheme.colors.textMuted,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 54,
    alignItems: 'center',
  },
  activeBadgeBg: {
    backgroundColor: ImhotepTheme.colors.depositGreenLight,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  inactiveBadgeBg: {
    backgroundColor: ImhotepTheme.colors.glassCardHover,
    borderColor: ImhotepTheme.colors.glassBorder,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ScheduledTransactionItem;

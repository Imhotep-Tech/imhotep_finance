import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from '@/components/ui/PressableScale';
import { Transaction } from '@/types/finance';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const isDeposit = String(transaction.trans_status).toLowerCase() === 'deposit';
  
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
    <PressableScale onPress={onPress} style={styles.container}>
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
            {transaction.trans_details || 'No Description'}
          </Text>
          <Text style={styles.date}>{transaction.date}</Text>
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
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
  date: {
    fontSize: 12,
    color: ImhotepTheme.colors.textMuted,
  },
});

export default TransactionItem;

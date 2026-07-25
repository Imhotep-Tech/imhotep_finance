import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from './PressableScale';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Transactions Yet',
  message = 'Your transaction list is empty or no results match your current filters.',
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name="receipt-outline" size={32} color={ImhotepTheme.colors.primaryTealGlow} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <PressableScale style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </View>
  );
};

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Unable to Load Data',
  message = 'Could not connect to Imhotep Finance server. Please check your internet connection and try again.',
  onRetry,
}) => {
  return (
    <View style={[styles.card, styles.errorBorder]}>
      <View style={[styles.iconWrapper, styles.errorIconBg]}>
        <Ionicons name="alert-circle-outline" size={32} color={ImhotepTheme.colors.withdrawRed} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <PressableScale style={styles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color={ImhotepTheme.colors.textPrimary} style={{ marginRight: 6 }} />
        <Text style={styles.retryBtnText}>Retry Connection</Text>
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
  },
  errorBorder: {
    borderColor: 'rgba(239, 68, 68, 0.30)',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorIconBg: {
    backgroundColor: ImhotepTheme.colors.withdrawRedLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: ImhotepTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(51, 65, 85, 0.80)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: ImhotepTheme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});

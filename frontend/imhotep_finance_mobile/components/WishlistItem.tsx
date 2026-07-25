import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from '@/components/ui/PressableScale';

export interface WishItem {
  id: number;
  price: string | number;
  currency: string;
  year: number;
  place?: string;
  wish_details: string;
  link?: string;
  status: boolean; // true = completed
  transaction_date?: string;
}

interface WishlistItemProps {
  wish: WishItem;
  onPress: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  loading?: boolean;
  deleteLoading?: boolean;
}

export const WishlistItem: React.FC<WishlistItemProps> = ({
  wish,
  onPress,
  onToggleStatus,
  onDelete,
  loading = false,
  deleteLoading = false,
}) => {
  const isCompleted = wish.status;

  const formattedPrice = Number(wish.price || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleOpenLink = async () => {
    if (wish.link) {
      try {
        let url = wish.link.trim();
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
          url = 'https://' + url;
        }
        await Linking.openURL(url);
      } catch (err) {
        console.error('An error occurred opening link:', err);
        Alert.alert('Error', 'Cannot open link: ' + wish.link);
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        isCompleted ? styles.completedBorder : styles.pendingBorder,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.details} numberOfLines={1}>
          {wish.wish_details || 'No Title'}
        </Text>
        <Text style={styles.price}>
          {formattedPrice} {wish.currency}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.yearText}>
          Target Year: {wish.year}
          {wish.place && wish.place !== 'General' ? ` • ${wish.place}` : ''}
        </Text>

        {wish.link ? (
          <PressableScale onPress={handleOpenLink} style={styles.linkButton}>
            <Ionicons name="link" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
            <Text style={styles.linkText}>View Link</Text>
          </PressableScale>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <PressableScale
          style={[
            styles.statusBtn,
            isCompleted ? styles.completedStatusBg : styles.pendingStatusBg,
          ]}
          onPress={onToggleStatus}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.statusBtnText}>Processing...</Text>
          ) : isCompleted ? (
            <View style={styles.completedInline}>
              <Ionicons name="checkmark-circle" size={16} color={ImhotepTheme.colors.depositGreen} />
              <Text style={[styles.statusBtnText, { color: ImhotepTheme.colors.depositGreen }]}>
                Goal Reached
              </Text>
            </View>
          ) : (
            <Text style={[styles.statusBtnText, { color: ImhotepTheme.colors.accentGoldGlow }]}>
              Mark Completed
            </Text>
          )}
        </PressableScale>

        {!isCompleted && (
          <View style={styles.iconActions}>
            <PressableScale onPress={onPress} style={styles.actionIconBtn}>
              <Ionicons name="pencil" size={18} color={ImhotepTheme.colors.textSecondary} />
            </PressableScale>
            <PressableScale onPress={onDelete} style={styles.actionIconBtn} disabled={deleteLoading}>
              <Ionicons name="trash" size={18} color={ImhotepTheme.colors.withdrawRed} />
            </PressableScale>
          </View>
        )}
      </View>

      {isCompleted && wish.transaction_date && (
        <Text style={styles.completedDateText}>
          Completed on: {wish.transaction_date}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    gap: 8,
  },
  pendingBorder: {
    borderLeftWidth: 4,
    borderLeftColor: ImhotepTheme.colors.accentGoldGlow,
  },
  completedBorder: {
    borderLeftWidth: 4,
    borderLeftColor: ImhotepTheme.colors.depositGreen,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  details: {
    fontSize: 16,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 13,
    color: ImhotepTheme.colors.primaryTealGlow,
    textDecorationLine: 'underline',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingStatusBg: {
    backgroundColor: ImhotepTheme.colors.accentGoldLight,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  completedStatusBg: {
    backgroundColor: ImhotepTheme.colors.depositGreenLight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ImhotepTheme.colors.glassCardHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedDateText: {
    fontSize: 11,
    color: ImhotepTheme.colors.textMuted,
    textAlign: 'right',
  },
});

export default WishlistItem;

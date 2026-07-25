import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from '@/components/ui/PressableScale';
import SkeletonShimmer from '@/components/ui/SkeletonShimmer';

interface NetWorthCardProps {
  networth: string | number;
  favoriteCurrency: string;
  loading: boolean;
  score?: number | null;
  scoreTxt?: string;
  mode?: 'dashboard' | 'navbar';
  onPress?: () => void;
}

const calculateFontSize = (value: string | number, mode: string): number => {
  if (mode === 'navbar') return 22;
  const digitsCount = String(value).replace(/[^0-9]/g, '').length;
  if (digitsCount > 15) return 24;
  if (digitsCount > 12) return 28;
  if (digitsCount > 9) return 32;
  if (digitsCount > 6) return 36;
  return 42;
};

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  networth,
  favoriteCurrency,
  loading,
  score,
  scoreTxt,
  mode = 'dashboard',
  onPress,
}) => {
  const formattedAmount = loading
    ? '0.00'
    : Number(networth || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const fontSize = calculateFontSize(formattedAmount, mode);

  return (
    <PressableScale onPress={onPress} style={styles.cardContainer}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.92)', 'rgba(11, 15, 25, 0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Subtle Ambient Glowing Accents (Egyptian Teal & Gold) */}
        <View style={styles.ambientGlowTeal} />
        <View style={styles.ambientGlowGold} />

        <View style={styles.headerRow}>
          <View style={styles.badgeContainer}>
            <Ionicons name="shield-checkmark" size={14} color={ImhotepTheme.colors.primaryTealGlow} />
            <Text style={styles.badgeText}>TOTAL NET WORTH</Text>
          </View>
          {scoreTxt ? (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{scoreTxt}</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.skeletonBox}>
            <SkeletonShimmer width={180} height={36} borderRadius={10} />
          </View>
        ) : (
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceAmount, { fontSize }]}>{formattedAmount}</Text>
            <Text style={styles.currencyBadge}>{favoriteCurrency}</Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.subtext}>Imhotep Vault Encrypted • Real-time</Text>
          <Ionicons name="chevron-forward" size={16} color={ImhotepTheme.colors.textMuted} />
        </View>
      </LinearGradient>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 22,
    minHeight: 160,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    justifyContent: 'space-between',
    position: 'relative',
  },
  ambientGlowTeal: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
  },
  ambientGlowGold: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ImhotepTheme.colors.accentGoldLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: ImhotepTheme.colors.textSecondary,
  },
  scorePill: {
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  skeletonBox: {
    paddingVertical: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  balanceAmount: {
    color: ImhotepTheme.colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencyBadge: {
    fontSize: 18,
    fontWeight: '700',
    color: ImhotepTheme.colors.primaryTealGlow,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtext: {
    fontSize: 12,
    color: ImhotepTheme.colors.textMuted,
  },
});

export default NetWorthCard;

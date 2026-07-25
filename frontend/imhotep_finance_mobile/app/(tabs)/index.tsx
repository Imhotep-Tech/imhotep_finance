import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import NetWorthCard from '@/components/NetWorthCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import UserGuideModal from '@/components/UserGuideModal';
import PressableScale from '@/components/ui/PressableScale';
import useFinanceSummary from '@/hooks/useFinanceSummary';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const {
    networth,
    favoriteCurrency,
    score,
    scoreTxt,
    target,
    loading,
    refetch,
  } = useFinanceSummary();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    const checkGuide = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('has_seen_guide');
        if (hasSeen !== 'true') {
          setShowGuide(true);
        }
      } catch (err) {
        console.warn('AsyncStorage read error:', err);
      }
    };
    checkGuide();
  }, []);

  const runApplyScheduledIfNeeded = async () => {
    try {
      const key = 'lastApplyScheduledDate';
      const today = new Date().toISOString().slice(0, 10);
      const last = await AsyncStorage.getItem(key);

      if (last === today) return;

      await api.post('/api/finance-management/scheduled-trans/apply-scheduled-trans/');
      await AsyncStorage.setItem(key, today);
    } catch (err) {
      console.warn('apply_scheduled_trans failed', err);
    }
  };

  const loadDashboardData = async () => {
    await runApplyScheduledIfNeeded();
    await refetch();
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getScoreColor = () => {
    if (score == null) return ['#D97706', '#B45309'] as const;
    if (score > 0) return ['#10B981', '#059669'] as const;
    if (score < 0) return ['#EF4444', '#DC2626'] as const;
    return ['#D97706', '#B45309'] as const;
  };

  const scoreColors = getScoreColor();

  return (
    <View style={styles.container}>
      {/* Background Glowing Orbs */}
      <View style={[styles.orb, styles.orbTeal]} />
      <View style={[styles.orb, styles.orbGold]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ImhotepTheme.colors.primaryTealGlow}
          />
        }
      >
        {/* Header Card (Archetype A Glassmorphism) */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="pie-chart" size={26} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>Imhotep Finance</Text>
              <Text style={styles.brandSubtitle}>Secure Financial Command Center</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>
            Welcome, {user?.first_name || user?.username || 'Trader'}
          </Text>
        </View>

        {/* Net Worth Bento Card */}
        <NetWorthCard
          networth={networth}
          favoriteCurrency={favoriteCurrency}
          loading={loading && networth === '0'}
          score={score}
          scoreTxt={scoreTxt}
          onPress={() => router.push('/show-networth-details')}
        />

        {/* Quick Deposit / Withdraw Actions */}
        <View style={styles.actionsGrid}>
          <PressableScale
            style={styles.actionButton}
            onPress={() => {
              setInitialType('deposit');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.iconCircle, styles.depositBg]}>
              <Ionicons name="add-circle" size={26} color={ImhotepTheme.colors.depositGreen} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Deposit</Text>

            </View>
          </PressableScale>

          <PressableScale
            style={styles.actionButton}
            onPress={() => {
              setInitialType('withdraw');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.iconCircle, styles.withdrawBg]}>
              <Ionicons name="remove-circle" size={26} color={ImhotepTheme.colors.withdrawRed} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Withdraw</Text>

            </View>
          </PressableScale>
        </View>

        {/* Monthly Target Status Card */}
        {scoreTxt ? (
          <LinearGradient
            colors={scoreColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <View style={styles.scoreHeader}>
              <Ionicons
                name={
                  score && score > 0
                    ? 'trending-up'
                    : score && score < 0
                    ? 'trending-down'
                    : 'remove-circle'
                }
                size={28}
                color="white"
              />
              <Text style={styles.scoreTitle}>Monthly Target Status</Text>
            </View>
            <Text style={styles.scoreText}>{scoreTxt}</Text>

            <View style={styles.scoreStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>
                  {target} {favoriteCurrency}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={styles.statValue}>
                  {score != null && score > 0 ? '+' : ''}
                  {score != null ? score.toFixed(0) : '0'} {favoriteCurrency}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>
                  {score != null && score > 0
                    ? 'Above'
                    : score != null && score < 0
                    ? 'Below'
                    : 'On Target'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.getStartedCard}>
            <View style={styles.getStartedIcon}>
              <Ionicons name="rocket-outline" size={28} color={ImhotepTheme.colors.primaryTealGlow} />
            </View>
            <Text style={styles.getStartedTitle}>Set Financial Goals</Text>
            <Text style={styles.getStartedText}>
              Set a monthly target in your profile to track your progress effortlessly.
            </Text>
            <PressableScale
              style={styles.getStartedButton}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.getStartedButtonText}>Set Target</Text>
            </PressableScale>
          </View>
        )}

        {/* Quick Links Grid (Bento Grid Style) */}
        <View style={styles.linksGrid}>
          <QuickLink
            icon="list"
            title="Transactions"
            subtitle="View History"
            color={ImhotepTheme.colors.primaryTealGlow}
            bg="rgba(20, 184, 166, 0.15)"
            href="/show_trans"
          />
          <QuickLink
            icon="calendar"
            title="Scheduled"
            subtitle="Recurring"
            color={ImhotepTheme.colors.accentGoldGlow}
            bg="rgba(245, 158, 11, 0.15)"
            href="/show_scheduled_trans"
          />
          <QuickLink
            icon="pie-chart"
            title="Net Worth"
            subtitle="Vault Details"
            color="#A855F7"
            bg="rgba(168, 85, 247, 0.15)"
            href="/show_networth_details"
          />
          <QuickLink
            icon="bar-chart"
            title="Reports"
            subtitle="Analytics"
            color="#3B82F6"
            bg="rgba(59, 130, 246, 0.15)"
            href="/reports"
          />
          <QuickLink
            icon="person"
            title="Manage Target"
            subtitle="Profile Goals"
            color="#10B981"
            bg="rgba(16, 185, 129, 0.15)"
            href="/profile"
          />
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadDashboardData();
        }}
      />

      {/* User Guide Modal */}
      <UserGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </View>
  );
}

const QuickLink = ({ icon, title, subtitle, color, bg, href }: any) => {
  const handlePress = () => {
    const routeMap: Record<string, string> = {
      '/show_trans': '/(tabs)/transactions',
      '/show_scheduled_trans': '/(tabs)/scheduled',
      '/show_networth_details': '/show-networth-details',
      '/reports': '/(tabs)/reports',
      '/profile': '/(tabs)/profile',
    };

    const route = routeMap[href];
    if (route) {
      router.push(route as any);
    } else {
      Alert.alert('Coming Soon', 'This feature is under construction.');
    }
  };

  return (
    <PressableScale style={styles.linkCard} onPress={handlePress}>
      <View style={[styles.linkIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkSubtitle}>{subtitle}</Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ImhotepTheme.colors.backgroundDark,
  },
  scrollContent: {
    padding: 16,
  },
  orb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: -1,
  },
  orbTeal: {
    top: 20,
    left: -60,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
  },
  orbGold: {
    top: 180,
    right: -60,
    backgroundColor: ImhotepTheme.colors.accentGoldLight,
  },
  headerCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoContainer: {
    width: 46,
    height: 46,
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: ImhotepTheme.colors.primaryTealGlow,
  },
  brandSubtitle: {
    fontSize: 12,
    color: ImhotepTheme.colors.textSecondary,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositBg: {
    backgroundColor: ImhotepTheme.colors.depositGreenLight,
  },
  withdrawBg: {
    backgroundColor: ImhotepTheme.colors.withdrawRedLight,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  scoreCard: {
    borderRadius: 24,
    padding: 20,
    marginVertical: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  getStartedCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginVertical: 12,
  },
  getStartedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  getStartedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    marginBottom: 6,
  },
  getStartedText: {
    textAlign: 'center',
    color: ImhotepTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  getStartedButton: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 12,
  },
  linkCard: {
    width: (width - 44) / 2,
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  linkSubtitle: {
    fontSize: 12,
    color: ImhotepTheme.colors.textMuted,
    marginTop: 2,
  },
});

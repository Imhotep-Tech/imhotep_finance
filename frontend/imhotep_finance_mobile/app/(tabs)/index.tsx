import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import NetWorthCard from '@/components/NetWorthCard';
import AddTransactionModal from '@/components/AddTransactionModal';
import api from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');


import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Dashboard() {
  const { user } = useAuth();
  // ... existing state ...
  const [networth, setNetworth] = useState('0');
  const [favoriteCurrency, setFavoriteCurrency] = useState('USD');
  const [score, setScore] = useState<number | null>(null);
  const [scoreTxt, setScoreTxt] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState<'deposit' | 'withdraw'>('deposit');

  const fetchData = async () => {
    try {
      // 1. Fetch Networth
      const networthRes = await api.get('/api/finance-management/get-networth/');
      setNetworth(networthRes.data.networth || '0');
      if (networthRes.data.favorite_currency) {
        setFavoriteCurrency(networthRes.data.favorite_currency);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNetworth('0');
      } else {
        console.warn('Networth fetch error:', err);
      }
    }

    try {
      // 2. Fetch Favorite Currency (redundant but good backup)
      const favRes = await api.get('/api/get-fav-currency/');
      setFavoriteCurrency(favRes.data.favorite_currency || favoriteCurrency || 'USD');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn('Favorite currency fetch error:', err);
      }
    }

    try {
      // 3. Fetch Target Score
      const scoreRes = await api.get('/api/finance-management/target/get-score/');
      if (scoreRes.data.score_txt) {
        setScore(scoreRes.data.score);
        setScoreTxt(scoreRes.data.score_txt);
        setTarget(scoreRes.data.target);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setScore(null);
        setScoreTxt('');
        setTarget('');
      } else {
        console.warn('Target score fetch error:', err);
      }
    }

    // 4. Update Last Login (fire and forget)
    api.post('/api/update-last-login/').catch(() => { });

    setLoading(false);
    setRefreshing(false);
  };

  const runApplyScheduledIfNeeded = async () => {
    try {
      const key = 'lastApplyScheduledDate';
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const last = await AsyncStorage.getItem(key);

      if (last === today) return;

      await api.post('/api/finance-management/scheduled-trans/apply-scheduled-trans/');

      // mark as done for today
      await AsyncStorage.setItem(key, today);
      console.log('Applied scheduled transactions for today');
    } catch (err) {
      console.warn('apply_scheduled_trans failed', err);
    }
  };

  useEffect(() => {
    fetchData();
    runApplyScheduledIfNeeded();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    runApplyScheduledIfNeeded();
  };

  const getScoreColor = () => {
    if (score === null) return ['#f59e0b', '#d97706'] as const; // Default/Neutral
    if (score > 0) return ['#10b981', '#059669'] as const; // Positive
    if (score < 0) return ['#ef4444', '#dc2626'] as const; // Negative
    return ['#f59e0b', '#d97706'] as const; // Neutral
  };

  const scoreColors = getScoreColor();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeStyles = {
    container: {
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
    text: {
      color: isDark ? '#f1f5f9' : '#1e293b',
    },
    subText: {
      color: isDark ? '#94a3b8' : '#64748b',
    },
    card: {
      backgroundColor: isDark ? '#1e293b' : 'white',
    },
    headerCard: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255,255,255,0.8)',
    },
    iconBg: {
      backgroundColor: isDark ? '#334155' : '#eaf6f6'
    }
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Background Decorative Elements */}
      <View style={[styles.orb, { top: 50, left: -50, backgroundColor: isDark ? 'rgba(54, 108, 107, 0.1)' : 'rgba(54, 108, 107, 0.2)' }]} />
      <View style={[styles.orb, { top: 100, right: -50, backgroundColor: isDark ? 'rgba(54, 108, 107, 0.1)' : 'rgba(54, 108, 107, 0.2)' }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#366c6b"} />
        }
      >
        {/* Header */}
        <View style={[styles.headerCard, themeStyles.headerCard]}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="pie-chart" size={30} color="#fff" />
            </View>
            <View>
              <Text style={[styles.brandName, { color: '#366c6b' }]}>Imhotep Finance</Text>
              <Text style={[styles.brandSubtitle, themeStyles.subText]}>Manage your finances</Text>
            </View>
          </View>
          <Text style={[styles.welcomeText, themeStyles.text]}>Welcome, {user?.first_name || user?.username}!</Text>
        </View>

        {/* Net Worth */}
        <NetWorthCard
          networth={networth}
          favoriteCurrency={favoriteCurrency}
          loading={loading && !refreshing && networth === '0'}
        />

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, themeStyles.card]}
            onPress={() => {
              setInitialType('withdraw');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(54, 108, 107, 0.2)' : '#e0f2f1' }]}>
              <Ionicons name="add-circle" size={32} color="#366c6b" />
            </View>
            <View>
              <Text style={[styles.actionTitle, themeStyles.text]}>Add Transaction</Text>
              <Text style={[styles.actionSubtitle, themeStyles.subText]}>Record income or expense</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly Target Status */}
        {scoreTxt ? (
          <LinearGradient
            colors={scoreColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <View style={styles.scoreHeader}>
              <Ionicons
                name={score && score > 0 ? "trending-up" : score && score < 0 ? "trending-down" : "remove-circle"}
                size={32}
                color="white"
              />
              <Text style={styles.scoreTitle}>Monthly Target Status</Text>
            </View>
            <Text style={styles.scoreText}>{scoreTxt}</Text>

            <View style={styles.scoreStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Target</Text>
                <Text style={styles.statValue}>{target} {favoriteCurrency}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={styles.statValue}>{score && score > 0 ? '+' : ''}{score?.toFixed(0)} {favoriteCurrency}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>{score && score > 0 ? 'Above' : score && score < 0 ? 'Below' : 'On Target'}</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.getStartedCard, themeStyles.card]}>
            <View style={[styles.getStartedIcon, themeStyles.iconBg]}>
              <Ionicons name="rocket-outline" size={32} color="#366c6b" />
            </View>
            <Text style={[styles.getStartedTitle, themeStyles.text]}>Get Started</Text>
            <Text style={[styles.getStartedText, themeStyles.subText]}>Set a monthly target in your profile to track your progress.</Text>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.getStartedButtonText}>Set Target</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Links Grid */}
        <View style={styles.linksGrid}>
          <QuickLink icon="list" title="Transactions" subtitle="View All" color="blue" href="/show_trans" isDark={isDark} />
          <QuickLink icon="calendar" title="Scheduled" subtitle="Recurring" color="indigo" href="/show_scheduled_trans" isDark={isDark} />
          <QuickLink icon="pie-chart" title="Net Worth" subtitle="Details" color="purple" href="/show_networth_details" isDark={isDark} />
          <QuickLink icon="bar-chart" title="Reports" subtitle="Analysis" color="emerald" href="/reports" isDark={isDark} />
          <QuickLink icon="person" title="Manage Target" subtitle="Goals" color="green" href="/profile" isDark={isDark} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        initialType={initialType}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchData();
        }}
      />
    </View>
  );
}

const QuickLink = ({ icon, title, subtitle, color, href, isDark }: any) => {
  // Mapping colors to hex
  const colorMap: any = {
    blue: '#2563eb',
    indigo: '#4f46e5',
    purple: '#9333ea',
    emerald: '#059669',
    green: '#16a34a'
  };
  const bgMap: any = {
    blue: isDark ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
    indigo: isDark ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff',
    purple: isDark ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff',
    emerald: isDark ? 'rgba(5, 150, 105, 0.2)' : '#d1fae5',
    green: isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7'
  };

  const handlePress = () => {
    // Map hrefs to actual routes
    const routeMap: any = {
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
    <TouchableOpacity
      style={[styles.linkCard, { backgroundColor: isDark ? '#1e293b' : 'white' }]}
      onPress={handlePress}
    >
      <View style={[styles.linkIcon, { backgroundColor: bgMap[color] }]}>
        <Ionicons name={icon} size={24} color={colorMap[color]} />
      </View>
      <Text style={[styles.linkTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{title}</Text>
      <Text style={[styles.linkSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color handled dynamically
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60, // Space for status bar
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: -1,
  },
  headerCard: {
    // Background color handled dynamically
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#366c6b',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    // Color handled dynamically or fixed
  },
  brandSubtitle: {
    fontSize: 12,
    // Color handled dynamically
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    // Color handled dynamically
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    // Background color handled dynamically
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    // Color handled dynamically
  },
  actionSubtitle: {
    fontSize: 12,
    // Color handled dynamically
  },
  scoreCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  getStartedCard: {
    // Background color handled dynamically
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  getStartedIcon: {
    width: 64,
    height: 64,
    // Background color handled dynamically
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // Color handled dynamically
    marginBottom: 8,
  },
  getStartedText: {
    textAlign: 'center',
    // Color handled dynamically
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#366c6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  linkCard: {
    width: (width - 48) / 2, // 2 columns with gaps
    // Background color handled dynamically
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    // Color handled dynamically
  },
  linkSubtitle: {
    fontSize: 12,
    // Color handled dynamically
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import ImhotepTheme from '@/constants/imhotepTheme';
import api from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import CurrencySelect from '@/components/CurrencySelect';
import PressableScale from '@/components/ui/PressableScale';
import { updateNetworthWidget } from '@/widgets/widget-updater';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'financial'>('profile');
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState('');
  const [deleteCredential, setDeleteCredential] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);

  // Email verification modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Profile form data
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Financial Data
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState('');
  const [initialCurrency, setInitialCurrency] = useState('');

  useEffect(() => {
    const checkAppLockStatus = async () => {
      try {
        const enabled = await AsyncStorage.getItem('app_lock_enabled');
        setAppLockEnabled(enabled === 'true');
      } catch (e) {
        console.error('Error loading app lock status:', e);
      }
    };
    checkAppLockStatus();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFinancialData();
    }
  }, [activeTab]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      try {
        const targetRes = await api.get('/api/finance-management/target/get-target/');
        setTarget(targetRes.data.target ? String(targetRes.data.target) : '');
      } catch (e: any) {
        if (e.response?.status !== 404) console.warn('Fetch target error', e);
      }

      try {
        const currRes = await api.get('/api/get-fav-currency/');
        const curr = currRes.data.favorite_currency || '';
        setCurrency(curr);
        setInitialCurrency(curr);
      } catch (e) {
        console.warn('Fetch currency error', e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAppLock = async (value: boolean) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric or passcode authentication.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: value ? 'Confirm to enable App Lock' : 'Confirm to disable App Lock',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        await AsyncStorage.setItem('app_lock_enabled', value ? 'true' : 'false');
        setAppLockEnabled(value);
        setSuccess(value ? 'App Lock enabled successfully!' : 'App Lock disabled successfully!');
      } else {
        Alert.alert('Authentication Failed', 'Could not verify your identity.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while setting up App Lock.');
    }
  };

  const handleProfileSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/profile/update/', profileData);

      if (response.data.email_verification_required) {
        setShowOtpModal(true);
        setSuccess('A verification code has been sent to your new email address.');
      } else {
        setSuccess(response.data.message || 'Profile updated successfully!');
      }

      if (response.data.user) {
        updateUser(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }

    setLoading(false);
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      await api.post('/api/profile/verify-email-change/', { otp });
      setShowOtpModal(false);
      setOtp('');
      setSuccess('Email changed successfully! Please log in again.');

      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Verification failed. Please try again.');
    }

    setOtpLoading(false);
  };

  const handlePasswordSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/profile/change-password/', passwordData);
      setSuccess(response.data.message || 'Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    }

    setLoading(false);
  };

  const handleFinancialSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (target !== '') {
        if (isNaN(Number(target)) || Number(target) < 0) {
          setError('Target must be a non-negative number');
          setLoading(false);
          return;
        }
        await api.post('/api/finance-management/target/manage-target/', { target });
      }

      if (currency && currency !== initialCurrency) {
        const res = await api.post('/api/change-fav-currency/', { fav_currency: currency });
        if (!res.data.success) {
          throw new Error('Failed to update currency');
        }
        setInitialCurrency(currency);
      }

      setSuccess('Financial settings updated successfully!');
      updateNetworthWidget();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout of Imhotep Finance?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (err) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Account & Settings</Text>
          <Text style={styles.headerSubtitle}>Personal Security & Vault Preferences</Text>
        </View>
        <PressableScale style={styles.logoutIconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={ImhotepTheme.colors.withdrawRed} />
        </PressableScale>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={ImhotepTheme.colors.primaryTealGlow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Trader'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email attached'}</Text>
          </View>
        </View>

        {/* Tab Segment Selector */}
        <View style={styles.tabContainer}>
          {(['profile', 'security', 'financial'] as const).map((tab) => (
            <PressableScale
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab(tab);
                setError('');
                setSuccess('');
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'profile' ? 'Profile' : tab === 'security' ? 'Security' : 'Goals'}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* Status Messages */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={ImhotepTheme.colors.withdrawRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={ImhotepTheme.colors.depositGreen} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* Tab 1: Profile Info */}
        {activeTab === 'profile' && (
          <View style={styles.bentoCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.first_name}
              onChangeText={(text) => setProfileData((p) => ({ ...p, first_name: text }))}
              placeholder="First Name"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.last_name}
              onChangeText={(text) => setProfileData((p) => ({ ...p, last_name: text }))}
              placeholder="Last Name"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={profileData.username}
              onChangeText={(text) => setProfileData((p) => ({ ...p, username: text }))}
              placeholder="Username"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={profileData.email}
              onChangeText={(text) => setProfileData((p) => ({ ...p, email: text }))}
              placeholder="Email Address"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <PressableScale style={styles.submitBtn} onPress={handleProfileSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Save Profile</Text>}
            </PressableScale>
          </View>
        )}

        {/* Tab 2: Security & App Lock */}
        {activeTab === 'security' && (
          <View style={styles.bentoCard}>
            <Text style={styles.cardTitle}>App Lock & Security</Text>

            {/* App Lock Switch Card */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.switchTitle}>Biometric & PIN App Lock</Text>
                <Text style={styles.switchSubtitle}>Require Face ID / Fingerprint when opening Imhotep Finance.</Text>
              </View>
              <Switch
                value={appLockEnabled}
                onValueChange={handleToggleAppLock}
                trackColor={{ false: 'rgba(51, 65, 85, 0.5)', true: ImhotepTheme.colors.primaryTeal }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.cardTitle}>Change Password</Text>

            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords.current}
              value={passwordData.current_password}
              onChangeText={(text) => setPasswordData((p) => ({ ...p, current_password: text }))}
              placeholder="Current Password"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords.new}
              value={passwordData.new_password}
              onChangeText={(text) => setPasswordData((p) => ({ ...p, new_password: text }))}
              placeholder="New Password (min 8 chars)"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords.confirm}
              value={passwordData.confirm_password}
              onChangeText={(text) => setPasswordData((p) => ({ ...p, confirm_password: text }))}
              placeholder="Confirm New Password"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
            />

            <PressableScale style={styles.submitBtn} onPress={handlePasswordSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
            </PressableScale>
          </View>
        )}

        {/* Tab 3: Financial Goals */}
        {activeTab === 'financial' && (
          <View style={styles.bentoCard}>
            <Text style={styles.cardTitle}>Monthly Financial Target</Text>
            <Text style={styles.switchSubtitle}>Set your savings or earnings target to track progress on your Dashboard.</Text>

            <Text style={styles.label}>Monthly Target Amount</Text>
            <TextInput
              style={styles.input}
              value={target}
              onChangeText={setTarget}
              placeholder="e.g. 5000"
              placeholderTextColor={ImhotepTheme.colors.textMuted}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Preferred Currency</Text>
            <CurrencySelect value={currency} onChange={setCurrency} />

            <PressableScale style={styles.submitBtn} onPress={handleFinancialSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Save Financial Goals</Text>}
            </PressableScale>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Account Actions</Text>
          <PressableScale style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Logout Account</Text>
          </PressableScale>
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
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
    fontSize: 26,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
  },
  logoutIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ImhotepTheme.colors.withdrawRedLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: ImhotepTheme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.withdrawRedLight,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: ImhotepTheme.colors.withdrawRed,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ImhotepTheme.colors.depositGreenLight,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    fontSize: 13,
    color: ImhotepTheme.colors.depositGreen,
    flex: 1,
  },
  bentoCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ImhotepTheme.colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    color: ImhotepTheme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: ImhotepTheme.colors.glassBorder,
    marginVertical: 18,
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
  submitBtn: {
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  dangerCard: {
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 24,
    padding: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ImhotepTheme.colors.withdrawRed,
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: ImhotepTheme.colors.withdrawRed,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

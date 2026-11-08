import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import api from '@/constants/api';
import CurrencySelect from '@/components/CurrencySelect'; // Import CurrencySelect
import { updateNetworthWidget } from '@/widgets/widget-updater';

// Theme colors
const themes = {
  light: {
    background: '#FFFFFF',
    surface: '#f1f5f9',
    surfaceActive: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#D1D5DB',
    borderLight: '#E5E7EB',
    primary: '#366c6b',
    primaryLight: '#eaf6f6',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    success: '#22C55E',
    successLight: '#F0FDF4',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    background: '#1e293b',
    surface: '#0f172a',
    surfaceActive: '#1e293b',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#334155',
    borderLight: '#1e293b',
    primary: '#51adac',
    primaryLight: '#244746',
    error: '#F87171',
    errorLight: '#7F1D1D',
    success: '#4ADE80',
    successLight: '#14532D',
    warning: '#FBBF24',
    warningLight: '#78350F',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#0f172a' : '#f8fafc';
  const colors = themes[isDark ? 'dark' : 'light'];
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper to scroll input into view on Android
  const scrollToInput = (yOffset: number) => {
    if (Platform.OS === 'android') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
      }, 100);
    }
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'financial'>('profile');
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load App Lock settings on mount
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

  const handleToggleAppLock = async (value: boolean) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric or passcode authentication.');
        return;
      }

      // Prompt authentication to verify user permission
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: value ? 'Confirm to enable App Lock' : 'Confirm to disable App Lock',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        await AsyncStorage.setItem('app_lock_enabled', value ? 'true' : 'false');
        setAppLockEnabled(value);
        setSuccess(value ? 'App Lock enabled successfully!' : 'App Lock disabled successfully!');
      } else {
        // Switch will not toggle if they cancel/fail
        Alert.alert('Authentication Failed', 'Could not verify your identity.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while setting up App Lock.');
    }
  };

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState(''); // 'password' or 'otp'
  const [deleteCredential, setDeleteCredential] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);

  // Email verification modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Profile form data
  const [profileData, setProfileData] = useState(() => ({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
  }));

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

  // Fetch Financial Data when tab is active
  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'financial') {
      api.get('/api/finance-management/target/get-target/')
        .then(res => {
          if (isMounted && res.data.target) setTarget(String(res.data.target));
        })
        .catch(() => {});

      api.get('/api/get-fav-currency/')
        .then(res => {
          if (isMounted) {
            const curr = res.data.favorite_currency || '';
            setCurrency(curr);
            setInitialCurrency(curr);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleRequestDeleteOTP = async () => {
    setDeleteLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/api/profile/request-delete-otp/');
      setSuccess(response.data.message || 'OTP sent successfully');
      setDeleteOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
    setDeleteLoading(false);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteCredential) {
      setError('Please enter your password or OTP');
      return;
    }
    
    setDeleteLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = deleteMethod === 'otp' 
        ? { otp: deleteCredential } 
        : { password: deleteCredential };
        
      await api.post('/api/profile/delete-account/', payload);
      setSuccess('Account deleted successfully');
      setShowDeleteModal(false);
      
      // Logout
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
    setDeleteLoading(false);
  };


  const handleProfileSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/profile/update/', profileData);

      // Check if email verification is required
      if (response.data.email_verification_required) {
        setPendingNewEmail(response.data.pending_new_email);
        setShowOtpModal(true);
        setSuccess('A verification code has been sent to your new email address.');
      } else {
        setSuccess(response.data.message || 'Profile updated successfully!');
      }

      // Update user context with new data
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
      setSuccess('Email changed successfully! Please log in again with your new email.');

      // Log out user after email change
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Verification failed. Please try again.');
    }

    setOtpLoading(false);
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setOtpError('');
    // Reset email to current value since verification was cancelled
    setProfileData(prev => ({ ...prev, email: user?.email || '' }));
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
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
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
      // Update Target
      if (target !== '') {
        if (isNaN(Number(target)) || Number(target) < 0) {
          setError('Target must be a non-negative number');
          setLoading(false);
          return;
        }
        await api.post('/api/finance-management/target/manage-target/', { target });
      }

      // Update Currency if changed
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
    Alert.alert(
      t('common.navigation.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: t('common.navigation.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert(t('common.status.error'), 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header} lightColor="#f8fafc" darkColor="#0f172a">
            <ThemedText type="title" style={styles.title}>{t('profile.title')}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('profile.subtitle')}
            </ThemedText>
          </ThemedView>

          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <ThemedText type="subtitle" style={styles.userName}>
              {user?.username || 'User'}
            </ThemedText>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'profile' && [styles.activeTab, { backgroundColor: colors.surfaceActive }],
              ]}
              onPress={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            >
              <ThemedText style={[styles.tabText, activeTab === 'profile' && { color: colors.primary }]}>
                {t('profile.sections.personal')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'security' && [styles.activeTab, { backgroundColor: colors.surfaceActive }],
              ]}
              onPress={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
            >
              <ThemedText style={[styles.tabText, activeTab === 'security' && { color: colors.primary }]}>
                {t('profile.sections.security')}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'financial' && [styles.activeTab, { backgroundColor: colors.surfaceActive }],
              ]}
              onPress={() => { setActiveTab('financial'); setError(''); setSuccess(''); }}
            >
              <ThemedText style={[styles.tabText, activeTab === 'financial' && { color: colors.primary }]}>
                {t('profile.fields.favoriteCurrency')}
              </ThemedText>
            </Pressable>
          </View>

          {/* Messages */}
          {error ? (
            <View style={[styles.messageBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
              <ThemedText style={{ color: colors.error }}>{error}</ThemedText>
            </View>
          ) : null}
          {success ? (
            <View style={[styles.messageBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <ThemedText style={{ color: colors.success }}>{success}</ThemedText>
            </View>
          ) : null}

          {/* Profile Form */}
          {activeTab === 'profile' && (
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.fields.firstName')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={profileData.first_name}
                    onChangeText={(text) => setProfileData({ ...profileData, first_name: text })}
                    placeholder={t('profile.placeholders.firstName')}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.halfInput}>
                  <ThemedText style={[styles.label, { color: colors.textSecondary }]}>{t('profile.fields.lastName')}</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={profileData.last_name}
                    onChangeText={(text) => setProfileData({ ...profileData, last_name: text })}
                    placeholder={t('profile.placeholders.lastName')}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.fields.username')} <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={profileData.username}
                  onChangeText={(text) => setProfileData({ ...profileData, username: text })}
                  placeholder={t('profile.placeholders.username')}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.fields.email')} <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder={t('profile.placeholders.email')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => scrollToInput(350)}
                />
              </View>

              {/* Language Selection Card */}
              <View style={[styles.securityCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8, marginBottom: 16 }]}>
                <ThemedText style={[styles.securityTitle, { color: colors.text, marginBottom: 4 }]} type="defaultSemiBold">
                  {t('profile.languagePreferences')}
                </ThemedText>
                <ThemedText style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                  {t('profile.languageSubtitle')}
                </ThemedText>
                <View style={{ gap: 8 }}>
                  {Object.values(supportedLanguages).map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        onPress={() => setLanguage(lang.code)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 14,
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceActive,
                          borderWidth: 1.5,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <ThemedText style={{ fontSize: 22 }}>{lang.flag}</ThemedText>
                          <View>
                            <ThemedText style={{
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? '700' : '600',
                              fontSize: 15,
                            }}>
                              {lang.nativeName}
                            </ThemedText>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                              {lang.name} ({lang.code.toUpperCase()})
                            </ThemedText>
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                onPress={handleProfileSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>{t('common.actions.update')}</ThemedText>
                )}
              </Pressable>

              {/* Danger Zone */}
              {user?.username !== 'demo' && (
                <View style={[styles.dangerZone, { borderTopColor: colors.error }]}>
                  <ThemedText style={[styles.dangerZoneTitle, { color: colors.error }]}>{t('profile.deleteAccount.dangerZone')}</ThemedText>
                  <ThemedText style={[styles.dangerZoneText, { color: colors.textSecondary }]}>
                    {t('profile.deleteAccount.dangerWarning')}
                  </ThemedText>
                  <Pressable
                    style={[styles.dangerButton, { backgroundColor: colors.errorLight, borderColor: colors.error }]}
                    onPress={() => {
                      setShowDeleteModal(true);
                      setDeleteMethod('');
                      setDeleteCredential('');
                      setDeleteOtpSent(false);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <ThemedText style={{ color: colors.error, fontWeight: 'bold' }}>{t('profile.deleteAccount.button')}</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Security Tab (App Lock & Password Change) */}
          {activeTab === 'security' && (
            <View style={styles.form}>
              {/* App Lock Settings Card */}
              <View style={[styles.securityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.securityRow}>
                  <View style={styles.securityTextContainer}>
                    <ThemedText style={[styles.securityTitle, { color: colors.text }]} type="defaultSemiBold">
                      {t('profile.fields.appLock')}
                    </ThemedText>
                    <ThemedText style={[styles.securityDescription, { color: colors.textSecondary }]}>
                      {t('profile.fields.appLockDesc')}
                    </ThemedText>
                  </View>
                  <Switch
                    value={appLockEnabled}
                    onValueChange={handleToggleAppLock}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <ThemedText style={[styles.sectionTitle, { color: colors.text }]} type="defaultSemiBold">
                {t('profile.passwords.title')}
              </ThemedText>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.passwords.currentPassword')} <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.current_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, current_password: text })}
                    placeholder={t('profile.placeholders.currentPassword')}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPasswords.current}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    <Ionicons
                      name={showPasswords.current ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.passwords.newPassword')} <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.new_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, new_password: text })}
                    placeholder={t('profile.placeholders.newPassword')}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPasswords.new}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    <Ionicons
                      name={showPasswords.new ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.passwords.confirmNewPassword')} <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.confirm_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirm_password: text })}
                    placeholder={t('profile.placeholders.confirmPassword')}
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPasswords.confirm}
                    onFocus={() => scrollToInput(450)}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    <Ionicons
                      name={showPasswords.confirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>{t('profile.passwords.updateButton')}</ThemedText>
                )}
              </Pressable>
            </View>
          )}

          {/* Financial Settings Form */}
          {activeTab === 'financial' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.financial.monthlyTarget')}
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: 18, fontWeight: 'bold' }]}
                  value={target}
                  onChangeText={(text) => setTarget(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />

                {/* Quick Increment Chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {[500, 1000, 5000, 10000].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        const cur = parseFloat(target) || 0;
                        setTarget(String(cur + val));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#334155' : '#f1f5f9',
                      }}
                    >
                      <ThemedText style={{ fontSize: 12, fontWeight: '600' }}>
                        +{val.toLocaleString()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setTarget('')}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                    }}
                  >
                    <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>
                      Clear
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Target Preview */}
                {parseFloat(target) > 0 && (
                  <View style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(54, 108, 107, 0.2)' : 'rgba(54, 108, 107, 0.08)',
                    borderColor: 'rgba(54, 108, 107, 0.3)',
                    borderWidth: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <View>
                      <ThemedText style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase' }}>
                        Target Goal
                      </ThemedText>
                      <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginTop: 2 }}>
                        {parseFloat(target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency || ''}
                      </ThemedText>
                    </View>
                    <Ionicons name="flag" size={20} color={colors.primary} />
                  </View>
                )}

                <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('profile.financial.monthlyTargetDesc')}
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  {t('profile.fields.favoriteCurrency')}
                </ThemedText>
                <CurrencySelect
                  value={currency}
                  onChange={setCurrency}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                onPress={handleFinancialSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>{t('profile.financial.saveSettings')}</ThemedText>
                )}
              </Pressable>
            </View>
          )}



          {/* Privacy Policy Button */}
          <Pressable 
            style={[styles.privacyButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.privacyButtonLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
              <ThemedText style={styles.privacyButtonText}>{t('common.navigation.privacyPolicy')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <ThemedText style={styles.logoutButtonText}>{t('common.navigation.logout')}</ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent
        onRequestClose={closeOtpModal}
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior="padding"
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <ThemedText type="subtitle" style={{ color: colors.text }}>{t('profile.emailChange.title')}</ThemedText>
              <Pressable onPress={closeOtpModal}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t('profile.emailChange.otpModalDesc', { email: pendingNewEmail })}
              </ThemedText>

              {otpError ? (
                <View style={[styles.messageBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                  <ThemedText style={{ color: colors.error }}>{otpError}</ThemedText>
                </View>
              ) : null}

              <TextInput
                style={[styles.otpInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/\D/g, ''));
                  if (otpError) setOtpError('');
                }}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={closeOtpModal}
                >
                  <ThemedText style={{ color: colors.textSecondary }}>{t('common.actions.cancel')}</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.verifyButton,
                    { backgroundColor: colors.primary },
                    (otpLoading || otp.length !== 6) && styles.buttonDisabled,
                  ]}
                  onPress={handleOtpSubmit}
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>{t('profile.emailChange.verify')}</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          behavior="padding"
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <ThemedText type="subtitle" style={{ color: colors.error }}>{t('profile.deleteAccount.title')}</ThemedText>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t('profile.deleteAccount.description')}
              </ThemedText>

              {!deleteMethod ? (
                <View style={{ gap: 12 }}>
                  <Pressable
                    style={[styles.dangerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setDeleteMethod('password')}
                  >
                    <ThemedText style={{ color: colors.text }}>{t('profile.deleteAccount.verifyPassword')}</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.dangerButton, { backgroundColor: colors.surface, borderColor: colors.border }, deleteLoading && styles.buttonDisabled]}
                    onPress={() => {
                      setDeleteMethod('otp');
                      handleRequestDeleteOTP();
                    }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <ThemedText style={{ color: colors.text }}>{t('profile.deleteAccount.verifyOtp')}</ThemedText>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {deleteMethod === 'otp' && deleteOtpSent && (
                    <ThemedText style={{ color: colors.success, fontSize: 14 }}>
                      {t('profile.deleteAccount.otpSent')}
                    </ThemedText>
                  )}
                  <View>
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                      {deleteMethod === 'otp' ? t('profile.deleteAccount.enterOtp') : t('profile.deleteAccount.enterPassword')}
                    </ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={deleteCredential}
                      onChangeText={setDeleteCredential}
                      placeholder={deleteMethod === 'otp' ? '123456' : '••••••••'}
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={deleteMethod === 'password'}
                      keyboardType={deleteMethod === 'otp' ? 'numeric' : 'default'}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.cancelButton, { borderColor: colors.border }]}
                      onPress={() => {
                        setDeleteMethod('');
                        setDeleteCredential('');
                        setError('');
                        setSuccess('');
                      }}
                    >
                      <ThemedText style={{ color: colors.textSecondary }}>{t('common.actions.back')}</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.verifyButton,
                        { backgroundColor: colors.error },
                        (deleteLoading || !deleteCredential) && styles.buttonDisabled,
                      ]}
                      onPress={handleConfirmDeleteAccount}
                      disabled={deleteLoading || !deleteCredential}
                    >
                      {deleteLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <ThemedText style={styles.buttonText}>{t('profile.deleteAccount.confirmDelete')}</ThemedText>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  form: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  privacyButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 32,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  verifyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    marginBottom: 16,
  },
  dangerButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  securityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

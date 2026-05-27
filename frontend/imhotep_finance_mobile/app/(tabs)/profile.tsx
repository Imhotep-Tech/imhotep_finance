import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  const { user, logout, updateUser, token } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#0f172a' : '#f8fafc';
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper to scroll input into view on Android
  const scrollToInput = (yOffset: number) => {
    if (Platform.OS === 'android') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
      }, 100);
    }
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'financial'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Load profile data on component mount
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

  // Fetch Financial Data when tab is active
  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFinancialData();
    }
  }, [activeTab]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch Target
      try {
        const targetRes = await api.get('/api/finance-management/target/get-target/');
        setTarget(targetRes.data.target ? String(targetRes.data.target) : '');
      } catch (e: any) {
        if (e.response?.status !== 404) console.warn('Fetch target error', e);
      }

      // Fetch Currency
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
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'Failed to logout. Please try again.');
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
            <ThemedText type="title" style={styles.title}>My Profile</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your account and preferences
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
                Profile
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'password' && [styles.activeTab, { backgroundColor: colors.surfaceActive }],
              ]}
              onPress={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            >
              <ThemedText style={[styles.tabText, activeTab === 'password' && { color: colors.primary }]}>
                Password
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
                Financial
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
                  <ThemedText style={[styles.label, { color: colors.textSecondary }]}>First Name</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={profileData.first_name}
                    onChangeText={(text) => setProfileData({ ...profileData, first_name: text })}
                    placeholder="First name"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.halfInput}>
                  <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Last Name</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={profileData.last_name}
                    onChangeText={(text) => setProfileData({ ...profileData, last_name: text })}
                    placeholder="Last name"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Username <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={profileData.username}
                  onChangeText={(text) => setProfileData({ ...profileData, username: text })}
                  placeholder="Username"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Email <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => scrollToInput(350)}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                onPress={handleProfileSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Update Profile</ThemedText>
                )}
              </Pressable>

              {/* Danger Zone */}
              {user?.username !== 'demo' && (
                <View style={[styles.dangerZone, { borderTopColor: colors.error }]}>
                  <ThemedText style={[styles.dangerZoneTitle, { color: colors.error }]}>Danger Zone</ThemedText>
                  <ThemedText style={[styles.dangerZoneText, { color: colors.textSecondary }]}>
                    Once you delete your account, there is no going back. Please be certain.
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
                    <ThemedText style={{ color: colors.error, fontWeight: 'bold' }}>Delete Account</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Password Form */}
          {activeTab === 'password' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Current Password <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.current_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, current_password: text })}
                    placeholder="Current password"
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
                  New Password <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.new_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, new_password: text })}
                    placeholder="New password (min 8 characters)"
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
                  Confirm Password <ThemedText style={{ color: colors.error }}>*</ThemedText>
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={passwordData.confirm_password}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirm_password: text })}
                    placeholder="Confirm new password"
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
                  <ThemedText style={styles.buttonText}>Change Password</ThemedText>
                )}
              </Pressable>
            </View>
          )}

          {/* Financial Settings Form */}
          {activeTab === 'financial' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Monthly Target Amount
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={target}
                  onChangeText={(text) => setTarget(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />
                <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  Set your monthly financial goal to track progress on the dashboard.
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                  Favorite Currency
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
                  <ThemedText style={styles.buttonText}>Save Financial Settings</ThemedText>
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
              <ThemedText style={styles.privacyButtonText}>Privacy Policy</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Logout Button */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
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
              <ThemedText type="subtitle" style={{ color: colors.text }}>Verify Email Change</ThemedText>
              <Pressable onPress={closeOtpModal}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                Enter the 6-digit OTP code sent to your new email address ({pendingNewEmail}). The code expires in 10 minutes.
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
                  <ThemedText style={{ color: colors.textSecondary }}>Cancel</ThemedText>
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
                    <ThemedText style={styles.buttonText}>Verify</ThemedText>
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
              <ThemedText type="subtitle" style={{ color: colors.error }}>Delete Account</ThemedText>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                This action cannot be undone. How would you like to verify your identity to proceed?
              </ThemedText>

              {!deleteMethod ? (
                <View style={{ gap: 12 }}>
                  <Pressable
                    style={[styles.dangerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setDeleteMethod('password')}
                  >
                    <ThemedText style={{ color: colors.text }}>Verify with Password</ThemedText>
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
                      <ThemedText style={{ color: colors.text }}>Verify with Email OTP</ThemedText>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {deleteMethod === 'otp' && deleteOtpSent && (
                    <ThemedText style={{ color: colors.success, fontSize: 14 }}>
                      An OTP has been sent to your email address.
                    </ThemedText>
                  )}
                  <View>
                    <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                      {deleteMethod === 'otp' ? 'Enter 6-digit OTP' : 'Enter your password'}
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
                      <ThemedText style={{ color: colors.textSecondary }}>Back</ThemedText>
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
                        <ThemedText style={styles.buttonText}>Confirm Delete</ThemedText>
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
    paddingBottom: 20,
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
});

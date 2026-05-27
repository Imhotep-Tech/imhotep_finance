import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useColorScheme,
} from 'react-native';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const themes = {
  light: {
    background: '#EEF2FF', // Light cool gray/blue
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#366c6b', // Imhotep teal
    primaryDark: '#1a3535', // Imhotep dark teal
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    success: '#22C55E',
    successText: '#15803d',
    inputBg: '#F9FAFB',
  },
  dark: {
    background: '#1F2937', // Dark gray
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#4B5563',
    primary: '#4d8f8e', // Lighter teal for dark mode
    primaryDark: '#2d5c5b',
    error: '#F87171',
    errorBg: '#7F1D1D',
    errorBorder: '#F87171',
    success: '#4ADE80',
    successText: '#A78BFA',
    inputBg: '#4B5563',
  },
};

export default function EmailVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Priority 1: Get email from route params
    if (params.email) {
      setEmail(params.email as string);
    } else {
      // Priority 2: Get email from AsyncStorage (fallback)
      const loadEmail = async () => {
        const storedEmail = await AsyncStorage.getItem('pendingVerificationEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      };
      loadEmail();
    }
  }, [params.email]);

  const verifyOtp = async (otpCode: string, userEmail: string) => {
    try {
      // Updated endpoint to match web
      const response = await axios.post('/api/auth/verify-otp/', {
        email: userEmail,
        otp: otpCode,
      });
      return { success: true, message: 'Verification successful' };
    } catch (error) {
      console.error('OTP Verification failed:', error);
      const axiosError = error as AxiosError<any>;

      let errorMessage = 'Verification failed';
      if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is missing.');
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp(otp, email);

    if (result.success) {
      setSuccess(true);
      // Clear stored email
      await AsyncStorage.removeItem('pendingVerificationEmail');

      // Redirect to login after a delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } else {
      setError(result.error || 'Verification failed');
    }

    setLoading(false);
  };

  // Success View
  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.successCard, { backgroundColor: colors.card }]}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={40} color="white" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Verified!</Text>
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Your account has been successfully verified. Redirecting to login...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <Image
                source={require('@/assets/images/imhotep_finance.png')}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={[styles.brandTitle, { color: colors.primary }]}>Imhotep Finance</Text>
          <Text style={[styles.title, { color: colors.text }]}>Verify Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the OTP sent to your email
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Start Cooking Code (OTP)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons
                name="keypad-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.otpInput, { color: colors.text }]}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Verify Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Text */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Didn't receive the code?{' '}
              <Link href="/(auth)/register" asChild>
                <Text style={[styles.linkText, { color: colors.primary }]}>Register again</Text>
              </Link>
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 4,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontWeight: '600',
  },
  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
});
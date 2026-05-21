import React, { useState } from 'react';
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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';

const themes = {
  light: {
    background: '#EEF2FF',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#D1D5DB',
    primary: '#366c6b', // Imhotep teal
    primaryLight: '#E6F0F0',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    success: '#16A34A',
    successBg: '#F0FDF4',
    successBorder: '#BBF7D0',
    successLight: '#DCFCE7',
    inputBg: '#FFFFFF',
  },
  dark: {
    background: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#4B5563',
    primary: '#4d8f8e', // Lighter teal for dark mode
    primaryLight: '#234242',
    error: '#F87171',
    errorBg: '#7F1D1D',
    errorBorder: '#F87171',
    success: '#4ADE80',
    successBg: '#14532D',
    successBorder: '#4ADE80',
    successLight: '#14532D',
    inputBg: '#4B5563',
  },
};

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const requestPasswordReset = async (userEmail: string) => {
    try {
      const response = await axios.post('/api/auth/password-reset/', {
        email: userEmail,
      });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Password reset request failed:', error);

      let errorMessage = 'Password reset request failed';

      const axiosError = error as AxiosError<any>;
      if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const confirmPasswordReset = async (userEmail: string, otpCode: string, password: string, confirmPass: string) => {
    try {
      const response = await axios.post('/api/auth/password-reset/confirm/', {
        email: userEmail,
        otp: otpCode,
        new_password: password,
        confirm_password: confirmPass,
      });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Password reset confirmation failed:', error);

      let errorMessage = 'Password reset failed';

      const axiosError = error as AxiosError<any>;
      if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    const result = await requestPasswordReset(email);

    if (result.success) {
      setStep('otp');
    } else {
      setError(result.error || 'Password reset request failed');
    }

    setLoading(false);
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await confirmPasswordReset(email, otp, newPassword, confirmPassword);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Password reset failed');
    }

    setLoading(false);
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    const result = await requestPasswordReset(email);

    if (result.success) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to resend OTP');
    }

    setResendLoading(false);
  };

  // Success Screen
  if (step === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark" size={32} color={colors.success} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Password Reset!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your password has been successfully reset. You can now log in with your new password.
            </Text>

            <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={StyleSheet.flatten([styles.submitButton, { backgroundColor: colors.primary }])}>
                  <Text style={styles.submitButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </Link>
          </View>
        </View>
      </View>
    );
  }

  // OTP + New Password Screen
  if (step === 'otp') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="key-outline" size={32} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to {email} and create your new password. The code expires in 10 minutes.
            </Text>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {resendSuccess ? (
              <View style={[styles.successBox, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                <Text style={[styles.successText, { color: colors.success }]}>New OTP sent successfully!</Text>
              </View>
            ) : null}

            {/* OTP Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
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
                    setOtp(text.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.placeholder}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.placeholder}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, (loading || otp.length !== 6) && styles.submitButtonDisabled]}
              onPress={handleOtpSubmit}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
                <Text style={[styles.resendLink, { color: colors.primary }]}>
                  {resendLoading ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Email */}
            <TouchableOpacity onPress={() => setStep('email')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Change email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Email Input Screen (initial)
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <Image
                source={require('@/assets/images/imhotep_finance.png')}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we'll send you a verification code to reset your password.
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons
                name="at-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com"
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

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
            onPress={handleEmailSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>Remembered your password? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.signInLink, { color: colors.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </Link>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  successBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eyeIcon: {
    paddingRight: 12,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
});
/**
 * GoogleSignInButton
 * ==================
 * Native Google Sign-In button for Imhotep Finance mobile.
 *
 * ⚠️  NATIVE MODULE — This component requires a native build to function.
 *     It will render a disabled "unavailable" state in Expo Go or any binary
 *     that does not include the @react-native-google-signin native module.
 *
 * After filling in your Client IDs below, run:
 *   npx eas build --platform android --profile preview
 * to get a build that includes the native module.
 *
 * Setup checklist:
 *   □ Replace WEB_GOOGLE_CLIENT_ID with your Web Client ID from GCP Console.
 *   □ Replace ANDROID_GOOGLE_CLIENT_ID with your Android-type Client ID from GCP Console
 *     (registered for com.imhoteptech.imhotep_finance with your SHA-1 signing key).
 *   □ Run a new EAS Build after adding the plugin to app.json (already done).
 *   □ iOS: fill in the iosUrlScheme in app.json and rebuild separately.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// ⚠️  REPLACE THESE WITH YOUR ACTUAL CLIENT IDs FROM GOOGLE CLOUD CONSOLE
// ---------------------------------------------------------------------------
const WEB_GOOGLE_CLIENT_ID = '777302174161-jvd8vmi0elgm1j8c4nku727ubr2amqc3.apps.googleusercontent.com';
const ANDROID_GOOGLE_CLIENT_ID = '35902732767-h61m3edl7ignbcngpefs85i6gli6jg89.apps.googleusercontent.com';
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lazy-load the native Google Sign-In module.
// Using require() inside a try/catch prevents a crash when the native
// 'RNGoogleSignin' TurboModule is absent (e.g. Expo Go, CI, unit tests).
// ---------------------------------------------------------------------------
type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let _gsiModule: GoogleSignInModule | null = null;
let _nativeAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _gsiModule = require('@react-native-google-signin/google-signin');
  // Poke the module to verify the native layer is present
  _gsiModule!.GoogleSignin.configure({ webClientId: WEB_GOOGLE_CLIENT_ID });
  _nativeAvailable = true;
} catch {
  _nativeAvailable = false;
  console.warn(
    '[GoogleSignInButton] Native RNGoogleSignin module not found. ' +
      'Run `npx eas build --platform android` to enable native Google Sign-In.'
  );
}

// ---------------------------------------------------------------------------
// Theme — matches login.tsx
// ---------------------------------------------------------------------------
const themes = {
  light: {
    buttonBorder: '#DADCE0',
    buttonBg: '#FFFFFF',
    text: '#3c4043',
    disabledText: '#9CA3AF',
    disabledBg: '#F3F4F6',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    error: '#DC2626',
  },
  dark: {
    buttonBorder: '#5f6368',
    buttonBg: '#374151',
    text: '#E8EAED',
    disabledText: '#6B7280',
    disabledBg: '#1F2937',
    errorBg: '#7F1D1D',
    errorBorder: '#F87171',
    error: '#F87171',
  },
};

interface Props {
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ onError }: Props) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const configuredRef = useRef(false);

  // Configure GoogleSignin once per component mount (only if native is available)
  useEffect(() => {
    if (!_nativeAvailable || !_gsiModule || configuredRef.current) return;
    try {
      _gsiModule.GoogleSignin.configure({
        webClientId: WEB_GOOGLE_CLIENT_ID,
        androidClientId: ANDROID_GOOGLE_CLIENT_ID,
        offlineAccess: false,
        scopes: ['profile', 'email'],
      });
      configuredRef.current = true;
    } catch (e) {
      console.warn('[GoogleSignInButton] configure() failed:', e);
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    if (!_nativeAvailable || !_gsiModule) return;
    if (loading) return;

    const { GoogleSignin, statusCodes, isSuccessResponse, isErrorWithCode } = _gsiModule;

    setLoading(true);
    setErrorMsg('');

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const signInResult = await GoogleSignin.signIn();

      if (!isSuccessResponse(signInResult)) {
        // User cancelled — silent fail
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const googleAccessToken = tokens.accessToken;

      if (!googleAccessToken) {
        throw new Error('No access token returned from Google Sign-In');
      }

      // POST the Google access token to our backend
      const response = await axios.post('/api/auth/google/mobile/', {
        access_token: googleAccessToken,
      });

      const { access, refresh, user: userData } = response.data;
      await login({ access, refresh, user: userData });
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[GoogleSignIn] Error:', error);

      let message = 'Google sign-in failed. Please try again.';

      if (_gsiModule && _gsiModule.isErrorWithCode(error)) {
        const { statusCodes } = _gsiModule;
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            return; // silent — user cancelled
          case statusCodes.IN_PROGRESS:
            message = 'Sign-in is already in progress.';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            message =
              Platform.OS === 'android'
                ? 'Google Play Services not available or outdated.'
                : 'Google Sign-In is not available on this device.';
            break;
          default:
            message = `Google sign-in error (${error.code})`;
        }
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      setErrorMsg(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [loading, login, router, onError]);

  // ---- Render: unavailable state when native module is missing ----
  if (!_nativeAvailable) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.disabledBg,
            borderColor: colors.buttonBorder,
            opacity: 0.6,
          },
        ]}
        disabled
        activeOpacity={1}
        accessibilityLabel="Google Sign-In unavailable — native build required"
      >
        <View style={styles.buttonContent}>
          <View style={styles.iconContainer}>
            <Text style={[styles.googleG, { color: colors.disabledText }]}>G</Text>
          </View>
          <Text style={[styles.buttonText, { color: colors.disabledText }]}>
            Google Sign-In (requires native build)
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ---- Render: active state ----
  return (
    <View>
      {errorMsg ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.buttonBg,
            borderColor: colors.buttonBorder,
          },
        ]}
        onPress={handleGoogleSignIn}
        disabled={loading}
        activeOpacity={0.8}
        accessibilityLabel="Sign in with Google"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
            </View>
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

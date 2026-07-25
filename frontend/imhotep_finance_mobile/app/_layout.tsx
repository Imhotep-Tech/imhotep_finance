import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import AppLockOverlay from '@/components/AppLockOverlay';
import AppLockSetupPromptModal from '@/components/AppLockSetupPromptModal';

import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import OfflineBanner from '@/components/OfflineBanner';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const isLockedRef = useRef(false);
  const isAuthenticating = useRef(false);
  const appState = useRef(AppState.currentState);

  const updateLockState = (val: boolean) => {
    setIsLocked(val);
    isLockedRef.current = val;
  };

  const authenticateUser = async () => {
    if (isAuthenticating.current) return;
    try {
      isAuthenticating.current = true;
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        updateLockState(false);
        isAuthenticating.current = false;
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Imhotep Financial Manager',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        updateLockState(false);
      }
    } catch (e) {
      console.error('App lock authentication error:', e);
    } finally {
      isAuthenticating.current = false;
    }
  };

  // Handle auth state changes (load lock or prompt on app start / login)
  useEffect(() => {
    const checkLockOnAuthChange = async () => {
      if (isAuthenticated) {
        const enabled = await AsyncStorage.getItem('app_lock_enabled');
        const hasPrompted = await AsyncStorage.getItem('has_prompted_app_lock_setup');

        if (enabled === 'true') {
          updateLockState(true);
          setTimeout(() => {
            authenticateUser();
          }, 300);
        } else if (hasPrompted !== 'true') {
          // Show setup prompt if App Lock is not enabled and hasn't been prompted yet
          setShowSetupPrompt(true);
        }
      } else {
        updateLockState(false);
        setShowSetupPrompt(false);
      }
    };
    checkLockOnAuthChange();
  }, [isAuthenticated]);

  const handleEnableAppLockFromPrompt = async () => {
    await AsyncStorage.setItem('app_lock_enabled', 'true');
    await AsyncStorage.setItem('has_prompted_app_lock_setup', 'true');
    setShowSetupPrompt(false);
    updateLockState(true);
    authenticateUser();
  };

  const handleSkipAppLockFromPrompt = async () => {
    await AsyncStorage.setItem('has_prompted_app_lock_setup', 'true');
    setShowSetupPrompt(false);
  };

  // Handle app background / foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isAuthenticated) {
          const enabled = await AsyncStorage.getItem('app_lock_enabled');
          if (enabled === 'true' && isLockedRef.current) {
            authenticateUser();
          }
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isAuthenticated) {
          const enabled = await AsyncStorage.getItem('app_lock_enabled');
          if (enabled === 'true' && !isAuthenticating.current) {
            updateLockState(true);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true }} />
      </Stack>

      {isLocked && isAuthenticated && (
        <AppLockOverlay onUnlock={authenticateUser} />
      )}

      <AppLockSetupPromptModal
        visible={showSetupPrompt}
        onEnable={handleEnableAppLockFromPrompt}
        onSkip={handleSkipAppLockFromPrompt}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
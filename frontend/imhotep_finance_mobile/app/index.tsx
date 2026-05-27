import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for the navigation root to be mounted and auth state to be resolved
    if (!rootNavigationState?.key || loading) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, loading, rootNavigationState?.key, router]);

  // Always show a loading spinner while waiting for auth and router to mount
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#366c6b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
});
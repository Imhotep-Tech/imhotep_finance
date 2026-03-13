import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import UpdateChecker from '@/components/UpdateChecker';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/* Deep link targets used by the Android home widget */}
      <Stack.Screen name="show-networth-details" />
      <Stack.Screen name="add-transaction" />
      {/* Optional dev/testing route */}
      <Stack.Screen name="networth-widget-test" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
        <UpdateChecker />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}

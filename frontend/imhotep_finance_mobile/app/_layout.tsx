import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import UpdateChecker from '@/components/UpdateChecker';
import OfflineBanner from '@/components/OfflineBanner';

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
      {/* <Stack.Screen name="networth-widget-test" /> */}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* 2. Place the banner right below the providers */}
        <OfflineBanner />
        
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
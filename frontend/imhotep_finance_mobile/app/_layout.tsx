import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import OfflineBanner from '@/components/OfflineBanner';

export const unstable_settings = {
  initialRouteName: '(auth)',
};




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
import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  useColorScheme,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface AppLockOverlayProps {
  onUnlock: () => void;
}

const { width } = Dimensions.get('window');

export default function AppLockOverlay({ onUnlock }: AppLockOverlayProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Premium colors aligned with the app theme
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    cardBackground: isDark ? '#1e293b' : '#ffffff',
    primary: isDark ? '#51adac' : '#366c6b',
    text: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    iconBg: isDark ? 'rgba(81, 173, 172, 0.15)' : 'rgba(54, 108, 107, 0.1)',
    shadow: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(54, 108, 107, 0.15)',
  };

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
      lightColor="#f8fafc"
      darkColor="#0f172a"
    >
      <View style={styles.content}>
        {/* App Branding */}
        <View style={styles.brandContainer}>
          <ThemedText style={[styles.brandName, { color: colors.primary }]} type="defaultSemiBold">
            IMHOTEP
          </ThemedText>
          <ThemedText style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            FINANCIAL MANAGER
          </ThemedText>
        </View>

        {/* Lock Icon Visual */}
        <View style={[styles.iconOuterRing, { backgroundColor: colors.iconBg }]}>
          <View style={[styles.iconInnerCircle, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
          </View>
        </View>

        {/* Title and Message */}
        <View style={styles.textContainer}>
          <ThemedText style={[styles.title, { color: colors.text }]} type="subtitle">
            App Locked
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            Your financial data is protected. Authenticate to unlock access.
          </ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.unlockButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={onUnlock}
          >
            <Ionicons name="finger-print-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.unlockButtonText}>Unlock App</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.retryLink,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={onUnlock}
          >
            <ThemedText style={[styles.retryText, { color: colors.primary }]}>
              Tap to authenticate with Passcode / PIN
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: Math.min(width * 0.85, 360),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandName: {
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: '600',
  },
  iconOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  unlockButton: {
    width: '100%',
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryLink: {
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

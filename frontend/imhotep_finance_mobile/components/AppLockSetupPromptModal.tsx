import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImhotepTheme from '@/constants/imhotepTheme';
import PressableScale from '@/components/ui/PressableScale';

interface AppLockSetupPromptModalProps {
  visible: boolean;
  onEnable: () => void;
  onSkip: () => void;
}

export const AppLockSetupPromptModal: React.FC<AppLockSetupPromptModalProps> = ({
  visible,
  onEnable,
  onSkip,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Glowing Lock Badge */}
          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={36} color={ImhotepTheme.colors.primaryTealGlow} />
            </View>
          </View>

          <Text style={styles.title}>Secure Your Vault</Text>
          <Text style={styles.description}>
            Imhotep Finance supports App Lock via Biometrics & Device Passcode to protect your sensitive financial records.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <Ionicons name="finger-print" size={18} color={ImhotepTheme.colors.primaryTealGlow} />
              <Text style={styles.featureText}>Instant Face ID / Fingerprint Unlock</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="lock-closed" size={18} color={ImhotepTheme.colors.accentGoldGlow} />
              <Text style={styles.featureText}>Automatic Lock when App is Backgrounded</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PressableScale style={styles.enableBtn} onPress={onEnable}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.enableBtnText}>Enable App Lock Now</Text>
            </PressableScale>

            <PressableScale style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipBtnText}>Maybe Later</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: ImhotepTheme.colors.backgroundSurface,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ImhotepTheme.colors.primaryTealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ImhotepTheme.colors.glassCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ImhotepTheme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: ImhotepTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    backgroundColor: ImhotepTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: ImhotepTheme.colors.glassBorder,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: ImhotepTheme.colors.textPrimary,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  enableBtn: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: ImhotepTheme.colors.primaryTeal,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  skipBtn: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    color: ImhotepTheme.colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AppLockSetupPromptModal;

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkSmsPermission,
  syncSettingsToNative,
  fetchDefaultTemplates,
  SmsTemplate,
  syncInbox
} from '@/utils/sms-tracker';

export default function SmsSettingsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [defaultTemplates, setDefaultTemplates] = useState<SmsTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const perm = await checkSmsPermission();
      setHasPermission(perm);

      const enabledStr = await AsyncStorage.getItem('sms_tracking_enabled');
      setIsEnabled(enabledStr === 'true');

      const defTemplates = await fetchDefaultTemplates();
      setDefaultTemplates(defTemplates);

      const customStr = await AsyncStorage.getItem('sms_custom_templates');
      if (customStr) {
        setCustomTemplates(JSON.parse(customStr));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      Alert.alert(
        'Permission Required',
        'SMS Tracking requires READ_SMS and RECEIVE_SMS permissions to work. Please grant them in your device settings.',
        [{ text: 'OK' }]
      );
      // In a real app we'd request the permission via PermissionsAndroid here
      // For now, assume user needs to manually grant it if it's not present.
    }

    setIsEnabled(value);
    await AsyncStorage.setItem('sms_tracking_enabled', value ? 'true' : 'false');
    await syncSettingsToNative(value, token, customTemplates);
  };

  const handleManualSync = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please grant SMS permissions first.');
      return;
    }

    setSyncing(true);
    try {
      const count = await syncInbox(customTemplates);
      Alert.alert('Sync Complete', `Successfully imported ${count} new transactions from SMS.`);
    } catch (e) {
      Alert.alert('Sync Failed', 'An error occurred while scanning your inbox.');
    } finally {
      setSyncing(false);
    }
  };

  const deleteCustomTemplate = async (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    await AsyncStorage.setItem('sms_custom_templates', JSON.stringify(updated));
    await syncSettingsToNative(isEnabled, token, updated);
  };

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#111827',
    textSub: isDark ? '#94a3b8' : '#6b7280',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#51adac',
    danger: '#ef4444'
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={{ color: colors.text }}>SMS Tracker</ThemedText>
        </View>
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={colors.textSub} style={{ marginBottom: 16 }} />
          <ThemedText style={{ color: colors.text, textAlign: 'center' }}>
            Automated SMS tracking is only available on Android devices.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: colors.text }}>SMS Tracker</ThemedText>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>Enable Auto-Tracking</ThemedText>
              <ThemedText style={{ color: colors.textSub, fontSize: 13, marginTop: 4 }}>
                Automatically log transactions in the background when bank SMS messages arrive.
              </ThemedText>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.syncBtn, { backgroundColor: colors.primary, opacity: syncing ? 0.7 : 1 }]}
          onPress={handleManualSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sync-outline" size={20} color="#fff" />
              <ThemedText style={styles.syncBtnText}>Scan Inbox for New Transactions</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>Custom Parsers</ThemedText>
            <TouchableOpacity onPress={() => router.push('/add-custom-parser')}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {customTemplates.length === 0 ? (
            <ThemedText style={{ color: colors.textSub, fontStyle: 'italic', padding: 16 }}>
              You haven't created any custom parsers yet.
            </ThemedText>
          ) : (
            customTemplates.map(t => (
              <View key={t.id} style={[styles.templateItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.templateInfo}>
                  <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{t.bankName} ({t.type})</ThemedText>
                  <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Sender: {t.sender}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => deleteCustomTemplate(t.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>Default Supported Banks</ThemedText>
          </View>
          {defaultTemplates.map(t => (
            <View key={t.id} style={[styles.templateItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.templateInfo}>
                <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{t.bankName} ({t.type})</ThemedText>
                <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Sender: {t.sender}</ThemedText>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  scroll: { padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textWrap: { flex: 1, paddingRight: 16 },
  syncBtn: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  syncBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  templateItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  templateInfo: { flex: 1 }
});

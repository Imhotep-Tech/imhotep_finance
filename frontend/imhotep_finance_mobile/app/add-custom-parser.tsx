import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateRegexFromSample, SmsTemplate, syncSettingsToNative } from '@/utils/sms-tracker';
import { useAuth } from '@/contexts/AuthContext';

export default function AddCustomParserScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1);
  const [sender, setSender] = useState('');
  const [bankName, setBankName] = useState('');
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  
  const [sample, setSample] = useState('');
  const [extractedNumbers, setExtractedNumbers] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [generatedRegex, setGeneratedRegex] = useState('');

  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#111827',
    textSub: isDark ? '#94a3b8' : '#6b7280',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#51adac',
    primaryLight: isDark ? '#244746' : '#eaf6f6',
    income: '#10b981',
    expense: '#ef4444',
  };

  const extractNumbers = () => {
    if (!sample) {
      Alert.alert('Error', 'Please enter a sample message.');
      return;
    }
    const matches = sample.match(/\b\d+(?:[.,]\d+)*\b/g);
    if (!matches || matches.length === 0) {
      Alert.alert('No numbers found', 'We could not find any numbers in your sample message.');
      return;
    }
    // Filter duplicates
    setExtractedNumbers(Array.from(new Set(matches)));
    setStep(3);
  };

  const handleSelectNumber = (num: string) => {
    setSelectedNumber(num);
    try {
      const regex = generateRegexFromSample(sample, num);
      setGeneratedRegex(regex);
      setStep(4);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSave = async () => {
    try {
      const newTemplate: SmsTemplate = {
        id: `custom-${Date.now()}`,
        sender,
        bankName,
        type,
        currency: 'EGP', // Assuming EGP for now, can be expanded
        regex: generatedRegex,
        isCustom: true
      };

      const customStr = await AsyncStorage.getItem('sms_custom_templates');
      const customTemplates: SmsTemplate[] = customStr ? JSON.parse(customStr) : [];
      customTemplates.push(newTemplate);

      await AsyncStorage.setItem('sms_custom_templates', JSON.stringify(customTemplates));
      
      const enabledStr = await AsyncStorage.getItem('sms_tracking_enabled');
      const isEnabled = enabledStr === 'true';
      await syncSettingsToNative(isEnabled, token, customTemplates);

      Alert.alert('Success', 'Custom parser saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save parser.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: colors.text }}>New Custom Parser</ThemedText>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={{ color: colors.text, marginBottom: 16 }}>Step 1: Contact Details</ThemedText>
              
              <ThemedText style={[styles.label, { color: colors.textSub }]}>SMS Sender Name or Number</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. VodafoneCash or NBE"
                placeholderTextColor={colors.textSub}
                value={sender}
                onChangeText={setSender}
              />

              <ThemedText style={[styles.label, { color: colors.textSub }]}>Place / Bank Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Vodafone Cash Wallet"
                placeholderTextColor={colors.textSub}
                value={bankName}
                onChangeText={setBankName}
              />

              <ThemedText style={[styles.label, { color: colors.textSub }]}>Transaction Type</ThemedText>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'deposit' ? { backgroundColor: colors.primaryLight, borderColor: colors.primary } : { borderColor: colors.border }]}
                  onPress={() => setType('deposit')}
                >
                  <ThemedText style={{ color: type === 'deposit' ? colors.primary : colors.textSub, fontWeight: 'bold' }}>Deposit / Income</ThemedText>
                </TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'withdraw' ? { backgroundColor: colors.primaryLight, borderColor: colors.primary } : { borderColor: colors.border }]}
                  onPress={() => setType('withdraw')}
                >
                  <ThemedText style={{ color: type === 'withdraw' ? colors.primary : colors.textSub, fontWeight: 'bold' }}>Withdraw / Expense</ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.nextBtn, { backgroundColor: colors.primary, marginTop: 32 }]}
                onPress={() => {
                  if (!sender || !bankName) Alert.alert('Error', 'Please fill all fields');
                  else setStep(2);
                }}
              >
                <ThemedText style={styles.nextBtnText}>Next</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={{ color: colors.text, marginBottom: 16 }}>Step 2: Sample Message</ThemedText>
              <ThemedText style={{ color: colors.textSub, marginBottom: 16 }}>
                Paste an exact copy of the SMS message you received from {sender}. Do not edit the numbers or dates.
              </ThemedText>
              
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Paste SMS here..."
                placeholderTextColor={colors.textSub}
                multiline
                value={sample}
                onChangeText={setSample}
              />

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                  <ThemedText style={{ color: colors.text }}>Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary, flex: 1, marginLeft: 12 }]} onPress={extractNumbers}>
                  <ThemedText style={styles.nextBtnText}>Analyze Message</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={{ color: colors.text, marginBottom: 16 }}>Step 3: Select Amount</ThemedText>
              <ThemedText style={{ color: colors.textSub, marginBottom: 16 }}>
                We found the following numbers in your message. Tap the one that represents the transaction amount.
              </ThemedText>
              
              <View style={styles.chipContainer}>
                {extractedNumbers.map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                    onPress={() => handleSelectNumber(num)}
                  >
                    <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>{num}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border, marginTop: 32 }]} onPress={() => setStep(2)}>
                <ThemedText style={{ color: colors.text }}>Back</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={{ color: colors.text, marginBottom: 16 }}>Step 4: Confirm & Save</ThemedText>
              <ThemedText style={{ color: colors.textSub, marginBottom: 16 }}>
                Your custom parser is ready!
              </ThemedText>
              
              <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Bank Name</ThemedText>
                <ThemedText style={{ color: colors.text, fontWeight: 'bold', marginBottom: 12 }}>{bankName}</ThemedText>
                
                <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Sender</ThemedText>
                <ThemedText style={{ color: colors.text, fontWeight: 'bold', marginBottom: 12 }}>{sender}</ThemedText>
                
                <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Type</ThemedText>
                <ThemedText style={{ color: type === 'deposit' ? colors.income : colors.expense, fontWeight: 'bold', marginBottom: 12 }}>
                  {type.toUpperCase()}
                </ThemedText>

                <ThemedText style={{ color: colors.textSub, fontSize: 12 }}>Extracted Amount</ThemedText>
                <ThemedText style={{ color: colors.primary, fontWeight: 'bold', fontSize: 24 }}>{selectedNumber}</ThemedText>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.backStepBtn, { borderColor: colors.border }]} onPress={() => setStep(3)}>
                  <ThemedText style={{ color: colors.text }}>Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary, flex: 1, marginLeft: 12 }]} onPress={handleSave}>
                  <ThemedText style={styles.nextBtnText}>Save Parser</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 16 },
  scroll: { padding: 16 },
  stepContainer: { flex: 1 },
  label: { marginBottom: 8, fontWeight: '600' },
  input: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  textArea: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, height: 150, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row' },
  typeBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  nextBtn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnRow: { flexDirection: 'row', marginTop: 32 },
  backStepBtn: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1 },
  previewCard: { padding: 20, borderRadius: 12, borderWidth: 1 }
});

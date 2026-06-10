import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultTemplatesJson from '../constants/default-sms-templates.json';
import api from '../constants/api';

const { SmsModule } = NativeModules;

export interface SmsTemplate {
  id: string;
  bankName: string;
  sender: string;
  type: 'deposit' | 'withdraw';
  currency: string;
  regex: string;
  isCustom?: boolean;
}

export interface ParsedTransaction {
  amount: number;
  currency: string;
  type: string;
  bankName: string;
  originalSms: string;
  date: string;
}

// Ensure module exists (Android only)
const isAndroid = Platform.OS === 'android';

export const checkSmsPermission = async (): Promise<boolean> => {
  if (!isAndroid || !SmsModule) return false;
  try {
    return await SmsModule.checkSmsPermission();
  } catch (e) {
    return false;
  }
};

export const fetchDefaultTemplates = async (): Promise<SmsTemplate[]> => {
  try {
    // In the future, this can fetch from a remote URL (e.g. GitHub raw JSON)
    // const res = await fetch('https://raw.githubusercontent.com/.../default-sms-templates.json');
    // return await res.json();
    return defaultTemplatesJson as SmsTemplate[];
  } catch (e) {
    console.warn('Failed to fetch remote templates, falling back to local');
    return defaultTemplatesJson as SmsTemplate[];
  }
};

export const syncSettingsToNative = async (
  enabled: boolean,
  token: string | null,
  customTemplates: SmsTemplate[]
) => {
  if (!isAndroid || !SmsModule) return;
  try {
    const defaultTemplates = await fetchDefaultTemplates();
    const allTemplates = [...defaultTemplates, ...customTemplates];

    const baseUrl = api.defaults.baseURL || '';
    
    if (token) {
      await SmsModule.setAuthDetails(token, baseUrl);
    }
    await SmsModule.setSmsSettings(enabled, JSON.stringify(allTemplates));
  } catch (e) {
    console.error('Failed to sync settings to native module', e);
  }
};

export const parseMessage = (body: string, sender: string, templates: SmsTemplate[]): ParsedTransaction | null => {
  for (const template of templates) {
    if (template.sender && !sender.toLowerCase().includes(template.sender.toLowerCase()) && !template.sender.toLowerCase().includes(sender.toLowerCase())) {
      continue;
    }

    try {
      const regex = new RegExp(template.regex, 'i');
      const match = regex.exec(body.replace(/\n/g, ' '));

      if (match) {
        let amountStr = '0';
        if (match.groups && match.groups.amount) {
          amountStr = match.groups.amount;
        } else if (match.length > 1) {
          amountStr = match[1];
        }

        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (amount > 0) {
          return {
            amount,
            currency: template.currency || 'EGP',
            type: template.type,
            bankName: template.bankName,
            originalSms: body,
            date: new Date().toISOString().split('T')[0]
          };
        }
      }
    } catch (e) {
      console.warn('Regex error for template', template.id, e);
    }
  }
  return null;
};

export const generateRegexFromSample = (sample: string, selectedText: string): string => {
  const index = sample.indexOf(selectedText);
  if (index === -1) throw new Error('Selected text not found in sample');

  const prefix = sample.substring(0, index);
  const suffix = sample.substring(index + selectedText.length);

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const generalize = (text: string) => {
    let result = escapeRegExp(text);
    // Replace dates
    result = result.replace(/\\b\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4}\\b/g, '\\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4}');
    result = result.replace(/\\b\\d{4}[\\/\\-]\\d{2}[\\/\\-]\\d{2}\\b/g, '\\d{4}[\\/\\-]\\d{2}[\\/\\-]\\d{2}');
    result = result.replace(/\\b\\d{2}[\\/\\-]\\d{2}\\b/g, '\\d{2}[\\/\\-]\\d{2}');
    // Replace account numbers or long digits
    result = result.replace(/\\b\\d{4,}\\b/g, '\\d+');
    // Replace whitespace
    result = result.replace(/\\s+/g, '\\s+');
    return result;
  };

  const amountPattern = '(?<amount>\\d+(?:[,\\.]\\d+)*)';
  return `^${generalize(prefix)}${amountPattern}${generalize(suffix)}$`;
};

export const syncInbox = async (customTemplates: SmsTemplate[]): Promise<number> => {
  if (!isAndroid || !SmsModule) return 0;

  try {
    const hasPermission = await checkSmsPermission();
    if (!hasPermission) return 0;

    const lastSyncStr = await AsyncStorage.getItem('sms_last_sync');
    // Default to 1 day ago if never synced
    const sinceTimestamp = lastSyncStr ? parseFloat(lastSyncStr) : Date.now() - 24 * 60 * 60 * 1000;

    const messages = await SmsModule.readSms(sinceTimestamp);
    if (!messages || messages.length === 0) {
      await AsyncStorage.setItem('sms_last_sync', Date.now().toString());
      return 0;
    }

    const defaultTemplates = await fetchDefaultTemplates();
    const allTemplates = [...defaultTemplates, ...customTemplates];
    
    // Load synced IDs to prevent duplicates if timestamp overlaps
    const syncedIdsStr = await AsyncStorage.getItem('sms_synced_ids');
    let syncedIds: string[] = syncedIdsStr ? JSON.parse(syncedIdsStr) : [];

    let processedCount = 0;
    let latestMessageDate = sinceTimestamp;

    for (const msg of messages) {
      if (syncedIds.includes(msg.id)) continue;

      if (msg.date > latestMessageDate) {
        latestMessageDate = msg.date;
      }

      const parsed = parseMessage(msg.body, msg.address, allTemplates);
      if (parsed) {
        try {
          const payload = {
            amount: parsed.amount,
            currency: parsed.currency,
            trans_status: parsed.type,
            category: 'Added Automatically',
            place: parsed.bankName,
            trans_details: `SMS Auto-add: ${parsed.originalSms.substring(0, 150)}`,
            date: new Date(msg.date).toISOString().split('T')[0]
          };

          await api.post('/api/finance-management/transaction/add-transactions/', payload);
          processedCount++;
          syncedIds.push(msg.id);
        } catch (apiErr) {
          console.error('Failed to auto-add transaction from SMS sync', apiErr);
        }
      }
    }

    // Keep only last 500 ids to save space
    if (syncedIds.length > 500) syncedIds = syncedIds.slice(-500);
    
    await AsyncStorage.setItem('sms_synced_ids', JSON.stringify(syncedIds));
    await AsyncStorage.setItem('sms_last_sync', latestMessageDate.toString());

    return processedCount;
  } catch (e) {
    console.error('Error during inbox sync', e);
    return 0;
  }
};

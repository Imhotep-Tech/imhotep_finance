import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LanguageInfo } from '@/locales';

const STORAGE_KEY = 'language_preference';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  supportedLanguages: Record<string, LanguageInfo>;
  currentLanguage: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function resolveKey(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);

  // Load language preference from storage on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.warn('Failed to load language preference:', e);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (newLang: string) => {
    if (!SUPPORTED_LANGUAGES[newLang]) return;
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }, []);

  const currentLangInfo = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  const isRTL = currentLangInfo.dir === 'rtl';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const currentDict = translations[language];
      let value = resolveKey(currentDict, key);

      // Fallback to DEFAULT_LANGUAGE if key not in active language
      if (value === undefined && language !== DEFAULT_LANGUAGE) {
        const defaultDict = translations[DEFAULT_LANGUAGE];
        value = resolveKey(defaultDict, key);
      }

      if (value === undefined) {
        return key;
      }

      return interpolate(value, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRTL,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguage: currentLangInfo,
    }),
    [language, setLanguage, t, isRTL, currentLangInfo]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation(): LanguageContextType {
  return useLanguage();
}

export default LanguageContext;

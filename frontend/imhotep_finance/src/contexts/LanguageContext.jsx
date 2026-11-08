import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../locales';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'language_preference';

/**
 * Resolve a nested key from an object using a dot-delimited path.
 * e.g. resolveKey(dict, 'dashboard.netWorth.title')
 */
function resolveKey(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders like `{name}` with params.name
 */
function interpolate(template, params) {
  if (!params || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES[saved]) {
        return saved;
      }
    } catch {
      // Ignore localStorage access issues
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES[newLang]) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore storage error
    }
  }, []);

  const currentLangInfo = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  const isRTL = currentLangInfo.dir === 'rtl';

  // Apply HTML direction and lang attribute whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('lang', language);
      root.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      if (isRTL) {
        root.classList.add('rtl');
      } else {
        root.classList.remove('rtl');
      }
    }
  }, [language, isRTL]);

  /**
   * Main translation function.
   * Usage: t('common.actions.save') or t('dashboard.welcome', { name: 'Karim' })
   */
  const t = useCallback((key, params) => {
    // 1. Try resolving in active language
    const currentDict = translations[language];
    let value = resolveKey(currentDict, key);

    // 2. Fall back to DEFAULT_LANGUAGE if not found
    if (value === undefined && language !== DEFAULT_LANGUAGE) {
      const defaultDict = translations[DEFAULT_LANGUAGE];
      value = resolveKey(defaultDict, key);
    }

    // 3. If still not found, return key path as fallback
    if (value === undefined) {
      return key;
    }

    return interpolate(value, params);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguage: currentLangInfo,
  }), [language, setLanguage, t, isRTL, currentLangInfo]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}

export default LanguageContext;

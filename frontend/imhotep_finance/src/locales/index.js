import commonEn from './en/common.json';
import authEn from './en/auth.json';
import dashboardEn from './en/dashboard.json';
import transactionsEn from './en/transactions.json';
import scheduledEn from './en/scheduled.json';
import wishlistEn from './en/wishlist.json';
import reportsEn from './en/reports.json';
import profileEn from './en/profile.json';
import landingEn from './en/landing.json';

import commonAr from './ar/common.json';
import authAr from './ar/auth.json';
import dashboardAr from './ar/dashboard.json';
import transactionsAr from './ar/transactions.json';
import scheduledAr from './ar/scheduled.json';
import wishlistAr from './ar/wishlist.json';
import reportsAr from './ar/reports.json';
import profileAr from './ar/profile.json';
import landingAr from './ar/landing.json';

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇺🇸',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇪🇬',
  },
};

export const DEFAULT_LANGUAGE = 'en';

export const translations = {
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    transactions: transactionsEn,
    scheduled: scheduledEn,
    wishlist: wishlistEn,
    reports: reportsEn,
    profile: profileEn,
    landing: landingEn,
  },
  ar: {
    common: commonAr,
    auth: authAr,
    dashboard: dashboardAr,
    transactions: transactionsAr,
    scheduled: scheduledAr,
    wishlist: wishlistAr,
    reports: reportsAr,
    profile: profileAr,
    landing: landingAr,
  },
};

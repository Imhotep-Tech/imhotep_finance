# 🌐 Localization & Multi-Language Architecture Guide

Imhotep Finance supports a fully modular, scalable internationalization (i18n) architecture across both the **Web Application** (`frontend/imhotep_finance`) and the **Mobile App** (`frontend/imhotep_finance_mobile`).

This guide details how translations are organized into separate module JSON files and explains how developers can add new languages or modules in minutes.

---

## 🏛️ Architecture Overview

The multi-language system is designed around three core principles:
1. **Modular JSON Files by Subsystem**: Translations are never bundled into single monolithic files. Each functional domain/module has its own dedicated JSON file per language.
2. **Unified Key Taxonomy Across Web & Mobile**: Both the React web application and the React Native mobile application share the exact same JSON key paths and parameter conventions.
3. **Safe Fallback & Zero Crashes**: If a key is missing in a newly added language, the engine automatically falls back to English (`en`). If still missing, it returns the key path rather than crashing the interface.
4. **Automatic Persistence & Directionality**: Language selections persist in `localStorage` (Web) and `AsyncStorage` (Mobile). For right-to-left languages (e.g., Arabic), the HTML document direction (`dir="rtl"`) is updated automatically.

---

## 📂 Modular JSON Directory Structure

### Web Application (`frontend/imhotep_finance/src/locales/`)
```
src/locales/
├── index.js                  # Aggregator, exports translations & supported languages
├── en/                       # English (default)
│   ├── common.json           # Navigation, common actions, buttons, pagination, footer
│   ├── auth.json             # Login, register, reset password, OTP verification
│   ├── dashboard.json        # Dashboard overview, greeting, net worth summary
│   ├── transactions.json     # Transactions list, modals, categories, places, filters
│   ├── scheduled.json        # Scheduled transactions, recurring frequencies
│   ├── wishlist.json         # Wishlist management, priority, conversion to expense
│   ├── reports.json          # Monthly & annual reports, charts, breakdowns
│   ├── profile.json          # Profile information, security, password, preferences
│   └── landing.json          # Public landing page, features, marketing copy
└── ar/                       # العربية (Arabic, RTL)
    ├── common.json
    ├── auth.json
    ├── dashboard.json
    ├── transactions.json
    ├── scheduled.json
    ├── wishlist.json
    ├── reports.json
    ├── profile.json
    └── landing.json
```

### Mobile Application (`frontend/imhotep_finance_mobile/locales/`)
```
locales/
├── index.ts                  # Aggregator with TypeScript types & supported languages
├── en/                       # English JSON modules
│   └── ...
└── ar/                       # Arabic JSON modules
    └── ...
```

---

## 🧩 Module Breakdown

| Module File | Purpose & Covered Scope |
|-------------|-------------------------|
| `common.json` | Global navigation items, common actions (Save, Cancel, Delete, Edit, Loading), status tags, offline notices, pagination, PWA prompts, and footer. |
| `auth.json` | Authentication views: Login, Register, Forgot Password, Reset Password, OTP verification, Google OAuth, and validation error messages. |
| `dashboard.json` | Dashboard greeting, welcome banners, Net Worth overview card, Target progress, and quick action cards. |
| `transactions.json` | Transaction lists, filter chips, search input, deposit/withdraw types, Add/Edit transaction modal, Place/Category selects, and CSV import. |
| `scheduled.json` | Recurring transactions, frequencies (Daily, Weekly, Monthly, Yearly), auto-apply status, next execution dates. |
| `wishlist.json` | Wishlist items, table column headers, year filters, completion status toggle, delete & unmark warnings, Add/Update wish modals. |
| `reports.json` | Analytical dashboards, Monthly/Annual summaries, Income vs Expense charts, and category/place breakdowns. |
| `profile.json` | Account information, password change form, favorite currency selector, app language preferences, and account deletion. |
| `landing.json` | Public landing page hero section, self-hosting notices, dynamic stats counters, feature cards, step-by-step onboarding guide, and CTA buttons. |

---

## 💻 Developer Usage

### 1. In React Web Components
Use the `useTranslation()` hook from `src/contexts/LanguageContext`:

```jsx
import { useTranslation } from '../contexts/LanguageContext';

export default function MyComponent() {
  const { t, language, setLanguage, isRTL } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.welcome', { name: 'Karim' })}</h1>
      <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
        {t('common.actions.save')}
      </button>
    </div>
  );
}
```

### 2. In React Native Mobile Screens
Use the `useTranslation()` hook from `@/contexts/LanguageContext`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/contexts/LanguageContext';

export default function MyScreen() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <View>
      <Text>{t('transactions.title')}</Text>
      <TouchableOpacity onPress={() => setLanguage('ar')}>
        <Text>{t('common.actions.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Dynamic Parameter Interpolation
Placeholders in JSON formatted as `{variable}` are automatically replaced:
```json
// dashboard.json
{
  "welcome": "Welcome, {name}!"
}
```
```js
t('dashboard.welcome', { name: 'Alex' }); // Output: "Welcome, Alex!"
```

---

## 🎛️ Language Switcher Placement Rules (Web & Mobile)

To ensure a clean, uncluttered user experience, the language selection controls follow strict placement rules:

1. **Before Login (Unauthenticated)**:
   - A dropdown menu is positioned prominently at the top right of the screen (Web) or top of the authentication card (Mobile).
   - Available on: Landing page, Login, Register, Forgot Password, Reset Password, and OTP Verification screens.
   - When opened, it reveals a list of all currently supported languages (`Object.values(supportedLanguages)`), allowing one-click language switching.

2. **Once Logged In (Authenticated)**:
   - The top navigation bar (`Navbar.jsx` on Web, Tab bar/Header on Mobile) **does not** display a language toggle.
   - Language preferences are **only accessible from the Profile page** (`/profile` on Web, `app/(tabs)/profile.tsx` on Mobile).
   - On the Profile page, language selection is rendered as a clean list/card displaying all available languages dynamically from `supportedLanguages`, with native names, flags, language codes, and active indicators.

---

## 🚀 How to Add a New Language in 3 Steps

Adding a new language (for example, French `fr` or Spanish `es`) requires zero changes to application pages or UI components.

### Step 1: Create the Translation Directory
Copy the `en/` folder into a new folder named after your target ISO 639-1 code:
```bash
# Web
cp -r frontend/imhotep_finance/src/locales/en frontend/imhotep_finance/src/locales/fr

# Mobile
cp -r frontend/imhotep_finance_mobile/locales/en frontend/imhotep_finance_mobile/locales/fr
```
Translate the string values inside the 9 module JSON files (`common.json`, `auth.json`, etc.).

### Step 2: Register in Web (`frontend/imhotep_finance/src/locales/index.js`)
```javascript
// Import the new module files
import commonFr from './fr/common.json';
import authFr from './fr/auth.json';
// ... other modules

export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇪🇬' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' }, // Added
};

export const translations = {
  en: { /* ... */ },
  ar: { /* ... */ },
  fr: {
    common: commonFr,
    auth: authFr,
    dashboard: dashboardFr,
    transactions: transactionsFr,
    scheduled: scheduledFr,
    wishlist: wishlistFr,
    reports: reportsFr,
    profile: profileFr,
    landing: landingFr,
  },
};
```

### Step 3: Register in Mobile (`frontend/imhotep_finance_mobile/locales/index.ts`)
Add the identical imports and dictionary mapping to `locales/index.ts`.

That's it! The new language will immediately appear in the Web and Mobile language switchers, and all components will render the new language seamlessly.

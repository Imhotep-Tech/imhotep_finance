## Imhotep Finance Mobile – Developer Guide

This is the mobile app for Imhotep Finance, built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/).

### Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the app (Expo Router entry)**

   ```bash
   npx expo start
   ```

   You can open it in:

   - A development build
   - Android emulator
   - iOS simulator
   - Expo Go (for JS-only testing; native widgets require a dev client)

### Android Net Worth Home Widget

The Android app includes a home-screen widget that surfaces the user's net worth and key actions.

- **Files**
  - Widget UI: `widgets/NetWorthWidget.tsx`
  - Widget task handler: `widget-task-handler.tsx`
  - Expo config: `app.json` (`react-native-android-widget` plugin and `NetWorthWidget` registration)
  - Entry point wiring: `index.ts` (registers the widget task handler and loads `expo-router/entry`)

- **Behavior**
  - **Root tap**: tapping anywhere on the widget background opens the Net Worth Details screen (`app/show-networth-details.tsx`).
  - **Net worth display**:
    - Shows total net worth in the **favorite currency**.
    - Handles loading and error states gracefully.
  - **Score chip**:
    - Shows the monthly target score value and colors:
      - Green for positive
      - Red for negative
      - Amber/neutral when no score
  - **Reload button**:
    - Calls the backend to refresh net worth and score data.
  - **Deposit / Withdraw buttons**:
    - `+ Deposit` opens the app via deep link: `imhotep-finance://add-transaction?type=deposit`
    - `- Withdraw` opens the app via deep link: `imhotep-finance://add-transaction?type=withdraw`

- **APIs used**
  - `GET /api/finance-management/get-networth/` – net worth and favorite currency
  - `GET /api/finance-management/target/get-score/` – monthly target score (optional)

- **Deep links**
  - `imhotep-finance://show-networth-details` → `app/show-networth-details.tsx`
  - `imhotep-finance://add-transaction?type=deposit` → Add Transaction (deposit)
  - `imhotep-finance://add-transaction?type=withdraw` → Add Transaction (withdraw)

### Widget Testing in Development

For development and QA, there is a **hidden test screen** that mimics the widget using normal React Native views:

- Screen: `app/networth-widget-test.tsx`
- Purpose:
  - Preview the widget layout in Expo Go.
  - Trigger the same API calls as the real widget.
  - Open `AddTransactionModal` directly with `initialType="deposit"` or `"withdraw"`.
  - Open the Net Worth Details screen by tapping anywhere else on the card.

This screen is **not linked from the dashboard in production**. You can still reach it manually during development by navigating to the `/networth-widget-test` route with Expo Router.

### Notes

- Any changes to `app.json` widget config or native dependencies require a new Android build (EAS build) for users to receive updates.
- JS-only changes can be shipped via EAS Update as long as they don't modify native config or require new native modules.

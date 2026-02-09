# 📱 Mobile App Guide

Complete guide for the Imhotep Finance React Native mobile application built with Expo.

---

## 📖 Overview

The **Imhotep Finance Mobile App** is a cross-platform mobile application built with React Native and Expo. It provides native iOS and Android experiences for managing your personal finances on the go.

### Key Features

- 📊 **Dashboard**: View balance, recent transactions, and financial overview
- 💰 **Transactions**: Add, edit, and manage income/expense transactions
- 📈 **Reports**: Analyze spending patterns with monthly/yearly reports
- 🎯 **Wishlist**: Track savings goals and progress
- ⏰ **Scheduled Transactions**: Manage recurring bills and income
- 👤 **Profile**: Manage account settings and preferences
- 🔐 **Secure Authentication**: JWT-based authentication with email verification
- 🌓 **Dark Mode**: Automatic theme switching based on system preferences

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** – [Download Node.js](https://nodejs.org/)
- **npm** or **yarn** – Comes with Node.js
- **Expo Go app** (for testing on physical devices):
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Optional (for native development):**
- **Android Studio** – [Download](https://developer.android.com/studio) (for Android emulator)
- **Xcode** – [Download](https://developer.apple.com/xcode/) (for iOS simulator, macOS only)

### Installation

```bash
# Navigate to mobile app directory
cd frontend/imhotep_finance_mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running the App

After starting the development server, you'll see a QR code and several options:

- **📱 Physical Device (Expo Go)**:
  1. Install Expo Go on your device
  2. Scan the QR code with:
     - iOS: Camera app
     - Android: Expo Go app
  
- **🤖 Android Emulator**: Press `a` in terminal
- **🍎 iOS Simulator**: Press `i` in terminal (macOS only)
- **🌐 Web Browser**: Press `w` in terminal

---

## 🏗️ Architecture

### Technology Stack

- **React Native 0.81** – Cross-platform mobile framework
- **Expo 54.x** – Development platform and tooling
- **TypeScript** – Type-safe JavaScript
- **Expo Router** – File-based routing system
- **Axios** – HTTP client for API requests
- **AsyncStorage** – Local data persistence
- **React Context API** – State management

### Project Structure

```
frontend/imhotep_finance_mobile/
├── app/                      # File-based routing (Expo Router)
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx        # Login screen
│   │   ├── register.tsx     # Registration screen
│   │   ├── forgot-password.tsx
│   │   └── verify-email.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Dashboard/Home
│   │   ├── transactions.tsx # Transaction list
│   │   ├── reports.tsx      # Financial reports
│   │   ├── wishlist.tsx     # Savings goals
│   │   ├── scheduled.tsx    # Recurring transactions
│   │   └── profile.tsx      # User profile
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx       # 404 page
├── components/              # Reusable components
│   ├── common/             # Common UI components
│   ├── forms/              # Form components
│   └── transactions/       # Transaction-specific components
├── constants/              # App constants
│   ├── api.ts             # API configuration
│   ├── Colors.ts          # Color palette
│   └── types.ts           # TypeScript types
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useColorScheme.ts # Theme detection
│   └── useTransactions.ts
├── assets/               # Images, fonts, icons
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `frontend/imhotep_finance_mobile/`:

```env
# Backend API URL
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
```

**Environment Selection:**

The app automatically selects the API URL based on the environment:

1. **Priority 1**: `EXPO_PUBLIC_API_URL` from `.env` file
2. **Priority 2**: Development mode (`__DEV__`): Uses local IP (e.g., `http://10.218.226.170:8000`)
3. **Priority 3**: Production mode: Uses production URL (e.g., `https://imhotepf.pythonanywhere.com`)

**Development Setup:**

For local development, update `constants/api.ts` with your machine's IP address:

```typescript
const DEV_URL = 'http://YOUR_LOCAL_IP:8000';
```

> 💡 **Tip**: Find your local IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### App Configuration

Edit `app.json` to customize app settings:

```json
{
  "expo": {
    "name": "Imhotep Financial Manager",
    "slug": "imhotep-finance",
    "version": "1.0.0",
    "icon": "./assets/images/imhotep_finance.png",
    "scheme": "imhotep-finance",
    "ios": {
      "bundleIdentifier": "com.imhoteptech.imhotep_finance_mobile"
    },
    "android": {
      "package": "com.imhoteptech.imhotep_finance_mobile"
    }
  }
}
```

---

## 🔐 Authentication

### Authentication Flow

1. **Registration**: Users create an account with email and password
2. **Email Verification**: Verification email sent with deep link
3. **Login**: JWT token received and stored in AsyncStorage
4. **Token Management**: Token included in all API requests
5. **Logout**: Token removed from storage

### Deep Linking

The app supports deep linking for email verification:

- `imhotep-finance://verify-email?token=...`
- `https://imhotep-finance.vercel.app/verify-email?token=...`

Deep links are configured in `app.json`:

```json
{
  "scheme": "imhotep-finance",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "imhotep-finance.vercel.app",
            "pathPrefix": "/verify-email"
          }
        ]
      }
    ]
  }
}
```

---

## 🧪 Development Workflow

### Development Mode

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start --clear

# Start in specific mode
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Debugging

**React Native Debugger:**
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Select "Debug Remote JS"

**Expo Dev Tools:**
- Press `m` in terminal to open developer menu
- View logs in terminal or Expo Dev Tools

**Console Logs:**
```typescript
console.log('Debug info:', data);
```

### Hot Reloading

- **Fast Refresh**: Automatically reloads on file save
- **Manual Reload**: Shake device → "Reload"

---

## 📦 Building for Production

### EAS Build (Recommended)

Expo Application Services (EAS) provides cloud-based builds:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

### Build Profiles

Edit `eas.json` to configure build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Local Builds

**Android APK:**
```bash
# Build APK locally
npx expo build:android -t apk
```

**iOS IPA:**
```bash
# Build IPA (requires macOS and Apple Developer account)
npx expo build:ios
```

---

## 🚀 Deployment

### App Store Deployment

**iOS (App Store):**

1. **Prerequisites**:
   - Apple Developer account ($99/year)
   - App Store Connect access
   
2. **Build**:
   ```bash
   eas build --platform ios
   ```

3. **Submit**:
   ```bash
   eas submit --platform ios
   ```

**Android (Google Play):**

1. **Prerequisites**:
   - Google Play Developer account ($25 one-time)
   - Signing key configured
   
2. **Build**:
   ```bash
   eas build --platform android
   ```

3. **Submit**:
   ```bash
   eas submit --platform android
   ```

### Over-the-Air (OTA) Updates

Expo supports OTA updates for JavaScript/asset changes:

```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

> ⚠️ **Note**: OTA updates don't work for native code changes (requires new build)

---

## 🧪 Testing

### Manual Testing

**Test on Physical Device:**
1. Install Expo Go
2. Scan QR code from `npx expo start`
3. Test all features

**Test on Emulator:**
```bash
# Android
npx expo start --android

# iOS (macOS only)
npx expo start --ios
```

### Testing Checklist

- [ ] Authentication (login, register, logout)
- [ ] Email verification deep links
- [ ] Dashboard displays correctly
- [ ] Add/edit/delete transactions
- [ ] View reports and charts
- [ ] Manage wishlist items
- [ ] Scheduled transactions
- [ ] Profile settings
- [ ] Dark mode switching
- [ ] Offline behavior
- [ ] API error handling

---

## 🐛 Troubleshooting

### Common Issues

**1. Metro Bundler Issues**

```bash
# Clear cache and restart
npx expo start --clear
```

**2. Module Not Found Errors**

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**3. Android Build Fails**

- Ensure Android Studio is installed
- Check Java version (requires JDK 11+)
- Clear Gradle cache: `cd android && ./gradlew clean`

**4. iOS Build Fails (macOS)**

- Ensure Xcode is installed
- Install CocoaPods: `sudo gem install cocoapods`
- Run `npx pod-install`

**5. API Connection Issues**

- Verify backend is running
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Ensure device/emulator can reach backend
- For physical devices, use local network IP (not `localhost`)

**6. Deep Links Not Working**

- Verify `scheme` in `app.json`
- Test with: `npx uri-scheme open imhotep-finance://verify-email --ios`
- Check intent filters for Android

---

## 📚 Additional Resources

### Official Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

### Useful Commands

```bash
# Check Expo CLI version
npx expo --version

# Update Expo SDK
npx expo install expo@latest

# Check for outdated packages
npx expo-doctor

# Generate app icons
npx expo prebuild

# Run TypeScript type checking
npx tsc --noEmit
```

### Community

- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Update Expo SDK
npx expo install expo@latest

# Update all packages to compatible versions
npx expo install --fix

# Update specific package
npm install package-name@latest
```

### Version Management

- **Semantic Versioning**: Follow semver (MAJOR.MINOR.PATCH)
- **Update `version` in `app.json`** before each release
- **Tag releases** in Git: `git tag -a v1.0.0 -m "Release 1.0.0"`

---

For more information, see:
- [Setup Guide](SETUP.md) - General project setup
- [API Documentation](API_DOCUMENTATION.md) - Backend API reference
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Configuration options

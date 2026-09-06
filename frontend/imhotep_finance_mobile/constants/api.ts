import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

// 1. Define your environments
const PROD_URL = 'https://imhotepf.pythonanywhere.com';

const trimTrailingSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

const getHostFromExpo = () => {
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
      ?.expoClient?.hostUri;
  return hostUri?.split(':')[0];
};

const getHostFromScriptUrl = () => {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;
  // Examples:
  // - http://192.168.1.5:8081/index.bundle?platform=android...
  // - exp://192.168.1.5:8081
  const match = scriptURL.match(/^(?:https?|exp):\/\/([^/:]+)/i);
  return match?.[1] ?? null;
};

const getDevUrl = () => {
  const detectedHost = getHostFromExpo() || getHostFromScriptUrl();
  if (detectedHost) return `http://${detectedHost}:8000`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
};

const DEV_URL = getDevUrl();

// 2. Smart Selection Logic
// Priority 1: If an .env file exists, use that.
// Priority 2: If we are in Development mode (npx expo start), use localhost backend.
// Priority 3: If we are in Production (APK), use PythonAnywhere.
const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_URL : PROD_URL);
const NORMALIZED_API_URL = trimTrailingSlash(API_URL);

console.log(`🚀 Connecting to Backend at: ${NORMALIZED_API_URL}`);

const api = axios.create({
  baseURL: NORMALIZED_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
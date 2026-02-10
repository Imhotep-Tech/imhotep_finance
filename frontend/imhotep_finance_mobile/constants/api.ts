import axios from 'axios';

// 1. Define your environments
const PROD_URL = 'https://imhotepf.pythonanywhere.com';
const DEV_URL = 'https://imhotepf.pythonanywhere.com'; // Your local Fedora IP

// 2. Smart Selection Logic
// Priority 1: If an .env file exists, use that.
// Priority 2: If we are in Development mode (npx expo start), use Local IP.
// Priority 3: If we are in Production (APK), use PythonAnywhere.
const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_URL : PROD_URL);

console.log(`🚀 Connecting to Backend at: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
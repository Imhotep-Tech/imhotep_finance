// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Remove trailing slash if present to avoid double slashes in URLs
export const API_URL = API_BASE_URL.endsWith('/') 
  ? API_BASE_URL.slice(0, -1) 
  : API_BASE_URL;

// Export for debugging purposes (only in development)
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_URL: API_URL,
    NODE_ENV: import.meta.env.MODE
  });
}

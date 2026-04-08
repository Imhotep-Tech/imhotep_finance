import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import api from '../constants/api';

interface AuthContextType {
  user: any;
  login: ({ access, refresh, user }: { access: string; refresh: string; user: any }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Configure axios defaults
axios.defaults.baseURL = api.defaults.baseURL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

let refreshPromise: Promise<string> | null = null;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Initial State must be null because loading from storage is async now
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Use refs to always have access to current token values in interceptors
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  // 2. Load data from AsyncStorage when the app starts
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        const storedAccess = await SecureStore.getItemAsync('access_token');
        const storedRefresh = await SecureStore.getItemAsync('refresh_token');

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedAccess) {
          setAccessToken(storedAccess);
          accessTokenRef.current = storedAccess;
        }
        if (storedRefresh) {
          setRefreshToken(storedRefresh);
          refreshTokenRef.current = storedRefresh;
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setStorageLoaded(true);
      }
    };

    loadStorageData();
  }, []);

  // Set auth token in axios headers
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      if (api) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
      if (api) delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  // Function to refresh the access token
  const refreshAccessToken = async (): Promise<string> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    // We must read refresh token from ref or storage here
    const currentRefreshToken = refreshTokenRef.current || await SecureStore.getItemAsync('refresh_token');

    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    refreshPromise = axios
      .post('/api/auth/token/refresh/', { refresh: currentRefreshToken })
      .then(async (response) => {
        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh;

        if (newAccessToken) {
          await SecureStore.setItemAsync('access_token', newAccessToken);
          setAccessToken(newAccessToken);
          accessTokenRef.current = newAccessToken;
        }
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          setRefreshToken(newRefreshToken);
          refreshTokenRef.current = newRefreshToken;
        }
        return newAccessToken;
      })
      .catch(async (error) => {
        console.error('Token refresh failed:', error);
        await logoutInternal(); // Use internal logout to avoid circular dependency
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  };

  // Internal logout function (doesn't call API, just clears local state)
  const logoutInternal = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    delete axios.defaults.headers.common['Authorization'];
    if (api) delete api.defaults.headers.common['Authorization'];

    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
  };

  // Axios interceptor (Logic is identical to Web, just adapted slightly)
  useEffect(() => {
    const createInterceptor = (axiosInstance: any) => {
      return axiosInstance.interceptors.response.use(
        (response: any) => response,
        async (error: any) => {
          const originalRequest = error.config;
          const url = originalRequest?.url || '';

          // Prevent infinite loops on auth endpoints
          const isAuthEndpoint =
            url.includes('/api/auth/token/refresh/') ||
            url.includes('/api/auth/login/') ||
            url.includes('/api/auth/logout/')

          // Use ref to get current refresh token value
          const currentRefreshToken = refreshTokenRef.current;

          if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            currentRefreshToken &&
            !isAuthEndpoint
          ) {
            originalRequest._retry = true;

            try {
              const newAccessToken = await refreshAccessToken();
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return axiosInstance(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );
    };

    // Set up interceptors for both axios and api instances
    const axiosInterceptor = createInterceptor(axios);
    const apiInterceptor = createInterceptor(api);

    return () => {
      axios.interceptors.response.eject(axiosInterceptor);
      api.interceptors.response.eject(apiInterceptor);
    };
  }, []); // Empty dependency array - interceptors use refs for current token values

  // Check if user is authenticated on app load (after storage is loaded)
  useEffect(() => {
    const checkAuth = async () => {
      if (!storageLoaded) return;

      const currentAccessToken = accessTokenRef.current;
      const currentRefreshToken = refreshTokenRef.current;

      if (currentAccessToken) {
        try {
          // Verify the token by fetching user data
          const response = await api.get('/api/user-data/');
          setUser(response.data);
          await SecureStore.setItemAsync('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token might be expired, try to refresh
          if (currentRefreshToken) {
            try {
              await refreshAccessToken();
              // After refresh, try fetching user data again
              const response = await api.get('/api/user-data/');
              setUser(response.data);
              await SecureStore.setItemAsync('user', JSON.stringify(response.data));
            } catch (refreshError) {
              console.error('Token refresh failed during auth check:', refreshError);
              await logoutInternal();
            }
          } else {
            await logoutInternal();
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [storageLoaded]);

  // Login Function
  const login = async ({ access, refresh, user }: { access: string; refresh: string; user: any }) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(user);
    accessTokenRef.current = access;
    refreshTokenRef.current = refresh;

    // Async Storage must be awaited
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  // Logout Function (with API call)
  const logout = async () => {
    try {
      const currentRefreshToken = refreshTokenRef.current;
      if (currentRefreshToken) {
        await axios.post('/api/auth/logout/', { refresh: currentRefreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    await logoutInternal();
  };

  // Update User Function
  const updateUser = async (userData: any) => {
    setUser(userData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    token: accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
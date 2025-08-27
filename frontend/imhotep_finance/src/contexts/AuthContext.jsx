import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

let refreshPromise = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));

  // Set auth token in axios headers
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    if (refreshPromise) return refreshPromise; // return ongoing promise 
    if (!refreshToken) throw new Error('No refresh token available');

    refreshPromise = axios
      .post('/api/auth/token/refresh/', { refresh: refreshToken })
      .then((response) => {
        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh;

        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          setAccessToken(newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
          setRefreshToken(newRefreshToken);
        }
        return newAccessToken;
      })
      .catch((error) => {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null; // reset 
      });

    return refreshPromise;
  };

  // Axios interceptor to handle token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Do not try to refresh for auth endpoints to avoid loops
        const url = originalRequest?.url || '';
        const isAuthEndpoint =
          url.includes('/api/auth/token/refresh/') ||
          url.includes('/api/auth/login/') ||
          url.includes('/api/auth/logout/') ||
          url.includes('/api/auth/google/');

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken) {
        try {
          const response = await axios.get('/api/user-data/');
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Auth check failed:', error);
          if (refreshToken) {
            try {
              await refreshAccessToken();
              const response = await axios.get('/api/user-data/');
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } catch (refreshError) {
              console.error('Token refresh failed during auth check:', refreshError);
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [accessToken]);

  const login = ({ access, refresh, user: userData }) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(userData);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await axios.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

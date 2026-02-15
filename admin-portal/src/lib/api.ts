import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if token needs refresh
    if (typeof window !== 'undefined') {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry, 10);
        const now = Date.now();
        
        if (expiryTime - now < TOKEN_REFRESH_THRESHOLD) {
          try {
            const refreshTokenValue = localStorage.getItem('refreshToken');
            if (refreshTokenValue) {
              const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
                refreshToken: refreshTokenValue,
              });
              
              const { accessToken, expiresIn } = response.data;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('tokenExpiry', String(Date.now() + expiresIn * 1000));
              
              config.headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch (error) {
            // Refresh failed, user will be logged out
            console.error('Token refresh failed:', error);
          }
        }
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (refreshTokenValue) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken: refreshTokenValue,
          });

          const { accessToken, expiresIn } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('tokenExpiry', String(Date.now() + expiresIn * 1000));

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API Helper functions
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((res) => res.data);

export const apiPost = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((res) => res.data);

export const apiPut = <T>(url: string, data?: unknown) =>
  api.put<T>(url, data).then((res) => res.data);

export const apiPatch = <T>(url: string, data?: unknown) =>
  api.patch<T>(url, data).then((res) => res.data);

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then((res) => res.data);

export default api;

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // localStorage is only available in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Avoid redirect loop on auth pages
        const isAuthPage = window.location.pathname.startsWith('/auth');
        if (!isAuthPage) {
          window.location.href = '/auth/login';
        }
      }
    }
    // Normalise error: prefer backend error body, fall back to axios error
    return Promise.reject(error.response?.data ?? error);
  },
);

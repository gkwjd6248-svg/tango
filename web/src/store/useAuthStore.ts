'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    nickname: string;
    countryCode: string;
  }) => Promise<void>;
  logout: () => void;
  loadToken: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        const response = await authApi.login({ email, password });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
        }
        set({ user: response.user, token: response.token, isAuthenticated: true });
      },

      register: async (data) => {
        const response = await authApi.register(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
        }
        set({ user: response.user, token: response.token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Rehydrate session on mount; also refreshes user profile
      loadToken: () => {
        const { token } = get();
        if (token) {
          set({ isAuthenticated: true, isLoading: false });
          authApi.getMe().then((user) => {
            set({ user });
          }).catch(() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
            }
            set({ token: null, isAuthenticated: false, isLoading: false });
          });
        } else {
          set({ isLoading: false });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'tango-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', state.token);
          }
        }
        if (state) {
          state.isLoading = false;
        }
      },
    },
  ),
);

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';

interface User {
  id: string;
  email: string;
  nickname: string;
  countryCode?: string;
  danceLevel?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; nickname: string; countryCode: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    await SecureStore.setItemAsync('token', response.token);
    set({ user: response.user, token: response.token, isAuthenticated: true });
  },

  register: async (data) => {
    const response = await authApi.register(data);
    await SecureStore.setItemAsync('token', response.token);
    set({ user: response.user, token: response.token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadToken: async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      set({ token, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));

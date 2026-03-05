import { apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  countryCode?: string;
  danceLevel?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: { email: string; password: string; nickname: string; countryCode: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  socialLogin: async (data: {
    provider: 'google' | 'kakao' | 'naver' | 'apple';
    token: string;
    nickname?: string;
    countryCode?: string;
  }) => {
    const response = await apiClient.post('/auth/social', data);
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: { nickname?: string; countryCode?: string; danceLevel?: string; avatarUrl?: string }): Promise<UserProfile> => {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },
};

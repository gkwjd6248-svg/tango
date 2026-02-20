import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  nickname: string;
  countryCode?: string;
  danceLevel?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    nickname: string;
    countryCode: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateMe: async (data: Partial<Pick<User, 'nickname' | 'countryCode' | 'danceLevel' | 'avatarUrl'>>): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },
};

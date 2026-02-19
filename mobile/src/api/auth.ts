import { apiClient } from './client';

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: { email: string; password: string; nickname: string; countryCode: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
};

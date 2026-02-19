import { apiClient } from './client';

export const eventsApi = {
  getEvents: async (params?: { city?: string; countryCode?: string; eventType?: string; page?: number }) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  getEvent: async (id: string) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },
};

import { apiClient } from './client';

export interface TangoEvent {
  id: string;
  title: string;
  eventType: string;
  description?: string;
  venueName: string;
  address?: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  endDatetime?: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  entryFee?: number;
  currency?: string;
  websiteUrl?: string;
  organizerName?: string;
}

export interface PaginatedEventsResponse {
  items: TangoEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventFilters {
  city?: string;
  countryCode?: string;
  eventType?: string;
  page?: number;
  limit?: number;
}

export const eventsApi = {
  getEvents: async (params?: EventFilters): Promise<PaginatedEventsResponse> => {
    const response = await apiClient.get<PaginatedEventsResponse>('/events', { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<TangoEvent> => {
    const response = await apiClient.get<TangoEvent>(`/events/${id}`);
    return response.data;
  },
};

import { apiClient } from './client';

export interface BookmarkedEvent {
  id: string;
  title: string;
  eventType: string;
  venueName: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  imageUrls: string[];
}

export interface PaginatedBookmarksResponse {
  items: BookmarkedEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const bookmarksApi = {
  toggleBookmark: async (eventId: string): Promise<{ bookmarked: boolean }> => {
    const response = await apiClient.post<{ bookmarked: boolean }>(
      `/events/${eventId}/bookmark`,
    );
    return response.data;
  },

  getBookmarks: async (
    page?: number,
    limit?: number,
  ): Promise<PaginatedBookmarksResponse> => {
    const response = await apiClient.get<PaginatedBookmarksResponse>('/events/bookmarks', {
      params: { page, limit },
    });
    return response.data;
  },

  checkBookmark: async (eventId: string): Promise<{ bookmarked: boolean }> => {
    const response = await apiClient.get<{ bookmarked: boolean }>(
      `/events/${eventId}/bookmark/check`,
    );
    return response.data;
  },
};

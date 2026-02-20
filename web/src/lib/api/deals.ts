import { apiClient } from './client';

export interface Deal {
  id: string;
  title: string;
  description: string;
  category: string;
  originalPrice: number;
  dealPrice: number;
  currency: string;
  discountPercentage: number;
  affiliateUrl: string;
  provider: string;
  imageUrl?: string;
}

export interface PaginatedDealsResponse {
  items: Deal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  starRating: number;
  price: number;
  currency: string;
  affiliateUrl: string;
  distanceKm?: number;
  imageUrl?: string;
}

export const dealsApi = {
  getDeals: async (params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedDealsResponse> => {
    const response = await apiClient.get('/affiliates/products', { params });
    return response.data;
  },

  getHotelsNearEvent: async (
    eventId: string,
    lat: number,
    lng: number,
    checkIn?: string,
    checkOut?: string,
  ): Promise<Hotel[]> => {
    const response = await apiClient.get<Hotel[]>('/affiliates/hotels', {
      params: { eventId, lat, lng, checkIn, checkOut },
    });
    return response.data;
  },
};

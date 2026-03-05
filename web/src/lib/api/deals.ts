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
  /** ISO 3166-1 alpha-2 country code (e.g. 'US', 'KR') or null for global products */
  targetCountry?: string | null;
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
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedDealsResponse> => {
    const response = await apiClient.get('/affiliates/products', { params });
    const data = response.data;
    return {
      items: data.items.map((item: {
        id: string;
        title: string;
        description: string;
        productCategory: string;
        originalPrice: number;
        dealPrice: number;
        currency: string;
        discountPercentage: number;
        affiliateProvider: string;
        affiliateUrl: string;
        imageUrls?: string[];
        targetCountry?: string | null;
      }) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.productCategory,
        originalPrice: item.originalPrice,
        dealPrice: item.dealPrice,
        currency: item.currency,
        discountPercentage: item.discountPercentage,
        affiliateUrl: item.affiliateUrl,
        provider: item.affiliateProvider,
        imageUrl: item.imageUrls?.[0] ?? undefined,
        targetCountry: item.targetCountry,
      })),
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    };
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

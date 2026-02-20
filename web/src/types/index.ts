// Shared TypeScript types mirroring the backend API contracts

export interface TangoEvent {
  id: string;
  title: string;
  eventType: 'milonga' | 'festival' | 'workshop' | 'class' | 'practica';
  description: string;
  venueName: string;
  venueAddress: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  endDatetime?: string;
  price?: number;
  currency?: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  organizer?: {
    name: string;
    contactEmail?: string;
  };
}

export interface TangoEventListItem {
  id: string;
  title: string;
  eventType: string;
  venueName: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  imageUrls?: string[];
}

export interface Post {
  id: string;
  contentText: string;
  mediaUrls: string[];
  postType: string;
  countryScope: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  translatedText?: string;
  user: {
    id: string;
    nickname: string;
    countryCode: string;
    avatarUrl?: string;
  };
}

export interface Comment {
  id: string;
  contentText: string;
  createdAt: string;
  parentCommentId: string | null;
  user: {
    id: string;
    nickname: string;
    countryCode: string;
  };
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  nickname: string;
  email: string;
  countryCode: string;
  avatarUrl?: string;
}

export type PostType = 'general' | 'question' | 'event_share' | 'video';
export type EventTypeFilter = 'all' | 'milonga' | 'festival' | 'workshop' | 'class' | 'practica';

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
  organizerContact?: string;
  isVerified?: boolean;
  createdBy?: string;
  maxParticipants?: number;
  registrationDeadline?: string;
  source?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlisted';
  message?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  event?: TangoEvent;
  user?: { nickname: string; email: string; avatarUrl?: string };
}

export interface RegistrationCounts {
  approved: number;
  pending: number;
  waitlisted: number;
  total: number;
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

export interface CreateEventData {
  title: string;
  eventType: string;
  description?: string;
  venueName: string;
  address?: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  endDatetime?: string;
  latitude?: number;
  longitude?: number;
  organizerName?: string;
  organizerContact: string;
  priceInfo?: string;
  currency?: string;
  websiteUrl?: string;
  imageUrls?: string[];
  maxParticipants?: number;
  registrationDeadline?: string;
}

export interface VoteResult {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    countryCode?: string;
    avatarUrl?: string;
  };
}

export interface PaginatedChatResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatTranslationResult {
  id: string;
  messageId: string;
  targetLanguage: string;
  translatedText: string;
  fromCache: boolean;
}

export interface ChatRoom {
  event: TangoEvent;
  lastMessage: ChatMessage | null;
  messageCount: number;
  lastActivity: string;
}

export const eventsApi = {
  getEvents: async (params?: EventFilters): Promise<PaginatedEventsResponse> => {
    const queryParams = params ? {
      city: params.city,
      country: params.countryCode,
      type: params.eventType,
      page: params.page,
      limit: params.limit,
    } : undefined;
    const response = await apiClient.get<PaginatedEventsResponse>('/events', { params: queryParams });
    return response.data;
  },

  getEvent: async (id: string): Promise<TangoEvent> => {
    const response = await apiClient.get<TangoEvent>(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<TangoEvent> => {
    const response = await apiClient.post<TangoEvent>('/events', data);
    return response.data;
  },

  voteEvent: async (eventId: string, voteType: 'like' | 'dislike'): Promise<VoteResult> => {
    const response = await apiClient.post<VoteResult>(`/events/${eventId}/vote`, { voteType });
    return response.data;
  },

  getEventVotes: async (eventId: string, userId?: string): Promise<VoteResult> => {
    const response = await apiClient.get<VoteResult>(`/events/${eventId}/votes`, {
      params: userId ? { userId } : undefined,
    });
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<{ deleted: boolean }> => {
    const response = await apiClient.delete<{ deleted: boolean }>(`/events/${eventId}`);
    return response.data;
  },

  verifyEvent: async (eventId: string): Promise<TangoEvent> => {
    const response = await apiClient.patch<TangoEvent>(`/events/${eventId}/verify`);
    return response.data;
  },

  reportEvent: async (eventId: string, data: { reason: string; description?: string }): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`/events/${eventId}/report`, data);
    return response.data;
  },

  // Image upload
  uploadImages: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await apiClient.post<{ urls: string[] }>(
      '/events/upload-images',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  // Registration
  registerForEvent: async (eventId: string, message?: string): Promise<EventRegistration> => {
    const response = await apiClient.post<EventRegistration>(
      `/events/${eventId}/register`,
      message ? { message } : {},
    );
    return response.data;
  },

  cancelRegistration: async (eventId: string): Promise<EventRegistration> => {
    const response = await apiClient.post<EventRegistration>(`/events/${eventId}/register/cancel`);
    return response.data;
  },

  getMyRegistrationStatus: async (eventId: string): Promise<{ registration: EventRegistration | null }> => {
    const response = await apiClient.get<{ registration: EventRegistration | null }>(
      `/events/${eventId}/register/my-status`,
    );
    return response.data;
  },

  getRegistrationCounts: async (eventId: string): Promise<RegistrationCounts> => {
    const response = await apiClient.get<RegistrationCounts>(`/events/${eventId}/registrations/counts`);
    return response.data;
  },

  getEventRegistrations: async (
    eventId: string,
    params?: { status?: string; page?: number; limit?: number },
  ) => {
    const response = await apiClient.get<{
      items: EventRegistration[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/events/${eventId}/registrations`, { params });
    return response.data;
  },

  updateRegistrationStatus: async (
    eventId: string,
    registrationId: string,
    data: { status: 'approved' | 'rejected'; adminNotes?: string },
  ): Promise<EventRegistration> => {
    const response = await apiClient.patch<EventRegistration>(
      `/events/${eventId}/registrations/${registrationId}`,
      data,
    );
    return response.data;
  },

  getMyChatRooms: async (): Promise<ChatRoom[]> => {
    const response = await apiClient.get<ChatRoom[]>('/events/my-chat-rooms');
    return response.data;
  },

  getMyEvents: async (page?: number, limit?: number): Promise<PaginatedEventsResponse> => {
    const response = await apiClient.get<PaginatedEventsResponse>('/events/my-events', {
      params: { page, limit },
    });
    return response.data;
  },

  getMyRegistrations: async (page?: number, limit?: number) => {
    const response = await apiClient.get<{
      items: EventRegistration[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/events/my-registrations', { params: { page, limit } });
    return response.data;
  },

  // Chat
  getChatMessages: async (eventId: string, page?: number, limit?: number): Promise<PaginatedChatResponse> => {
    const response = await apiClient.get<PaginatedChatResponse>(
      `/events/${eventId}/chat`,
      { params: { page, limit } },
    );
    return response.data;
  },

  sendChatMessage: async (eventId: string, message: string): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(
      `/events/${eventId}/chat`,
      { message },
    );
    return response.data;
  },

  translateChatMessage: async (
    eventId: string,
    messageId: string,
    targetLanguage: string,
  ): Promise<ChatTranslationResult> => {
    const response = await apiClient.post<ChatTranslationResult>(
      `/events/${eventId}/chat/${messageId}/translate`,
      { targetLanguage },
    );
    return response.data;
  },
};

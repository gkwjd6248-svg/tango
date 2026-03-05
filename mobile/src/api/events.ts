import { apiClient } from './client';

export interface EventDetail {
  id: string;
  title: string;
  eventType: string;
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
  organizerName?: string;
  organizerContact?: string;
  websiteUrl?: string;
  isVerified?: boolean;
  createdBy?: string;
  maxParticipants?: number;
  registrationDeadline?: string;
  source?: string;
}

export interface PaginatedEventsResponse {
  items: EventDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoteResult {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
}

export interface RegistrationCounts {
  approved: number;
  pending: number;
  waitlisted: number;
  total: number;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'waitlisted';
  message?: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    id: string;
    nickname: string;
    countryCode?: string;
    email?: string;
  };
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
  };
  translations?: Record<string, string>;
}

export interface ChatRoom {
  eventId: string;
  eventTitle: string;
  eventType: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export const eventsApi = {
  getEvents: async (params?: { city?: string; countryCode?: string; eventType?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<EventDetail> => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data: Partial<EventDetail>): Promise<EventDetail> => {
    const response = await apiClient.post('/events', data);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  getMyEvents: async (page?: number, limit?: number): Promise<PaginatedEventsResponse> => {
    const response = await apiClient.get('/events/my-events', { params: { page, limit } });
    return response.data;
  },

  // Registration
  registerForEvent: async (id: string, message?: string): Promise<Registration> => {
    const response = await apiClient.post(`/events/${id}/register`, { message });
    return response.data;
  },

  cancelRegistration: async (id: string): Promise<void> => {
    await apiClient.post(`/events/${id}/register/cancel`);
  },

  getMyRegistrationStatus: async (id: string): Promise<{ status: string | null }> => {
    const response = await apiClient.get(`/events/${id}/register/my-status`);
    return response.data;
  },

  getRegistrationCounts: async (id: string): Promise<RegistrationCounts> => {
    const response = await apiClient.get(`/events/${id}/registrations/counts`);
    return response.data;
  },

  getEventRegistrations: async (id: string, params?: { status?: string; page?: number; limit?: number }): Promise<{ items: Registration[]; total: number }> => {
    const response = await apiClient.get(`/events/${id}/registrations`, { params });
    return response.data;
  },

  updateRegistrationStatus: async (eventId: string, regId: string, data: { status: string; adminNotes?: string }): Promise<Registration> => {
    const response = await apiClient.patch(`/events/${eventId}/registrations/${regId}`, data);
    return response.data;
  },

  getMyRegistrations: async (page?: number, limit?: number): Promise<PaginatedEventsResponse> => {
    const response = await apiClient.get('/events/my-registrations', { params: { page, limit } });
    return response.data;
  },

  // Chat
  getMyChatRooms: async (): Promise<ChatRoom[]> => {
    const response = await apiClient.get('/events/my-chat-rooms');
    return response.data;
  },

  getChatMessages: async (id: string, page?: number, limit?: number): Promise<{ items: ChatMessage[]; total: number; page: number; totalPages: number }> => {
    const response = await apiClient.get(`/events/${id}/chat`, { params: { page, limit } });
    return response.data;
  },

  sendChatMessage: async (id: string, message: string): Promise<ChatMessage> => {
    const response = await apiClient.post(`/events/${id}/chat`, { message });
    return response.data;
  },

  translateChatMessage: async (eventId: string, messageId: string, targetLanguage: string): Promise<{ translatedText: string }> => {
    const response = await apiClient.post(`/events/${eventId}/chat/${messageId}/translate`, { targetLanguage });
    return response.data;
  },

  // Voting
  voteEvent: async (id: string, voteType: 'like' | 'dislike'): Promise<VoteResult> => {
    const response = await apiClient.post(`/events/${id}/vote`, { voteType });
    return response.data;
  },

  getEventVotes: async (id: string): Promise<VoteResult> => {
    const response = await apiClient.get(`/events/${id}/votes`);
    return response.data;
  },

  // Report
  reportEvent: async (id: string, data: { reason: string; description?: string }): Promise<void> => {
    await apiClient.post(`/events/${id}/report`, data);
  },

  // Verify (admin)
  verifyEvent: async (id: string): Promise<void> => {
    await apiClient.patch(`/events/${id}/verify`);
  },

  // Image upload
  uploadImages: async (formData: FormData): Promise<{ imageUrls: string[] }> => {
    const response = await apiClient.post('/events/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

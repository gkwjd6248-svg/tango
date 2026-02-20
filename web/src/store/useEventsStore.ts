'use client';

import { create } from 'zustand';
import { eventsApi, TangoEvent, EventFilters } from '@/lib/api/events';

interface EventsState {
  events: TangoEvent[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filters: EventFilters;

  fetchEvents: (filters?: EventFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<EventFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_LIMIT = 12;

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filters: {},

  fetchEvents: async (newFilters?: EventFilters) => {
    const filters = newFilters ?? get().filters;
    set({ isLoading: true, error: null, filters });
    try {
      const response = await eventsApi.getEvents({ ...filters, page: 1, limit: DEFAULT_LIMIT });
      set({
        events: response.items,
        total: response.total,
        page: 1,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { page, totalPages, filters, isLoadingMore, events } = get();
    if (isLoadingMore || page >= totalPages) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true });
    try {
      const response = await eventsApi.getEvents({
        ...filters,
        page: nextPage,
        limit: DEFAULT_LIMIT,
      });
      set({
        events: [...events, ...response.items],
        page: nextPage,
        totalPages: response.totalPages,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  setFilters: (partialFilters: Partial<EventFilters>) => {
    const current = get().filters;
    const merged = { ...current, ...partialFilters };
    set({ filters: merged });
  },

  resetFilters: () => {
    set({ filters: {} });
  },
}));

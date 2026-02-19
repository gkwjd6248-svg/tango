import { create } from 'zustand';
import { eventsApi } from '../api/events';

interface TangoEvent {
  id: string;
  title: string;
  eventType: string;
  venueName: string;
  city: string;
  countryCode: string;
  startDatetime: string;
  endDatetime?: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
}

interface EventState {
  events: TangoEvent[];
  isLoading: boolean;
  error: string | null;
  filters: { city?: string; countryCode?: string; eventType?: string };
  fetchEvents: () => Promise<void>;
  setFilters: (filters: Partial<EventState['filters']>) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  filters: {},

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventsApi.getEvents(get().filters);
      set({ events: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchEvents();
  },
}));

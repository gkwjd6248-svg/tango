'use client';

import { create } from 'zustand';
import { dealsApi, Deal } from '@/lib/api/deals';

interface DealsState {
  deals: Deal[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  selectedCategory: string;
  page: number;
  totalPages: number;
  hasMore: boolean;

  fetchDeals: () => Promise<void>;
  loadMore: () => Promise<void>;
  setCategory: (category: string) => void;
}

const PAGE_LIMIT = 20;

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  selectedCategory: 'all',
  page: 1,
  totalPages: 1,
  hasMore: true,

  fetchDeals: async () => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const { selectedCategory } = get();
      const response = await dealsApi.getDeals({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page: 1,
        limit: PAGE_LIMIT,
      });
      set({
        deals: response.items,
        isLoading: false,
        page: 1,
        totalPages: response.totalPages,
        hasMore: response.page < response.totalPages,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load deals';
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { isLoading, isLoadingMore, hasMore, page, deals, selectedCategory } = get();
    if (isLoading || isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true });
    try {
      const response = await dealsApi.getDeals({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page: nextPage,
        limit: PAGE_LIMIT,
      });
      set({
        deals: [...deals, ...response.items],
        isLoadingMore: false,
        page: nextPage,
        hasMore: nextPage < response.totalPages,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  setCategory: (category: string) => {
    set({ selectedCategory: category });
    get().fetchDeals();
  },
}));

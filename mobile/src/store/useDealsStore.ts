import { create } from 'zustand';
import { dealsApi, Deal } from '../api/deals';

interface DealsState {
  deals: Deal[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  page: number;
  hasMore: boolean;

  fetchDeals: () => Promise<void>;
  loadMore: () => Promise<void>;
  setCategory: (category: string) => void;
}

const PAGE_LIMIT = 20;

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  isLoading: false,
  error: null,
  selectedCategory: 'all',
  page: 1,
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
        hasMore: response.page < response.totalPages,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load deals', isLoading: false });
    }
  },

  loadMore: async () => {
    const { isLoading, hasMore, page, deals, selectedCategory } = get();
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const response = await dealsApi.getDeals({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        page: nextPage,
        limit: PAGE_LIMIT,
      });
      set({
        deals: [...deals, ...response.items],
        isLoading: false,
        page: nextPage,
        hasMore: nextPage < response.totalPages,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load more deals', isLoading: false });
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category });
    get().fetchDeals();
  },
}));

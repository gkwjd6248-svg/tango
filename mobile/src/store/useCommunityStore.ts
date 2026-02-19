import { create } from 'zustand';
import { communityApi, Post } from '../api/community';

interface CommunityFilters {
  countryScope?: string;
}

interface CommunityState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  filters: CommunityFilters;
  page: number;
  hasMore: boolean;

  fetchPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (data: {
    contentText: string;
    mediaUrls?: string[];
    postType?: string;
    countryScope?: string;
  }) => Promise<void>;
  setFilters: (filters: Partial<CommunityFilters>) => void;
  updatePostLike: (postId: string, liked: boolean, likeCount: number) => void;
  updatePostTranslation: (postId: string, translatedText: string) => void;
}

const PAGE_LIMIT = 20;

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,
  filters: {},
  page: 1,
  hasMore: true,

  fetchPosts: async () => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await communityApi.getPosts({
        ...get().filters,
        page: 1,
        limit: PAGE_LIMIT,
      });
      set({
        posts: response.items,
        isLoading: false,
        hasMore: response.page < response.totalPages,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load posts', isLoading: false });
    }
  },

  loadMore: async () => {
    const { isLoading, hasMore, page, posts, filters } = get();
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const response = await communityApi.getPosts({
        ...filters,
        page: nextPage,
        limit: PAGE_LIMIT,
      });
      set({
        posts: [...posts, ...response.items],
        isLoading: false,
        page: nextPage,
        hasMore: nextPage < response.totalPages,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load more posts', isLoading: false });
    }
  },

  createPost: async (data) => {
    const response = await communityApi.createPost(data);
    set((state) => ({ posts: [response, ...state.posts] }));
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
    get().fetchPosts();
  },

  updatePostLike: (postId, liked, likeCount) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, likeCount } : post,
      ),
    }));
  },

  updatePostTranslation: (postId, translatedText) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, translatedText } : post,
      ),
    }));
  },
}));

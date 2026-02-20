'use client';

import { create } from 'zustand';
import { communityApi, Post } from '@/lib/api/community';

interface CommunityState {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  countryScope: string | undefined;

  fetchPosts: (countryScope?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (data: {
    contentText: string;
    postType?: string;
    countryScope?: string;
  }) => Promise<Post>;
  setCountryScope: (scope: string | undefined) => void;
  updatePostLike: (postId: string, liked: boolean, likeCount: number) => void;
  updatePostTranslation: (postId: string, translatedText: string) => void;
}

const DEFAULT_LIMIT = 10;

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  countryScope: undefined,

  fetchPosts: async (countryScope?: string) => {
    const scope = countryScope !== undefined ? countryScope : get().countryScope;
    set({ isLoading: true, error: null, countryScope: scope });
    try {
      const response = await communityApi.getPosts({
        countryScope: scope,
        page: 1,
        limit: DEFAULT_LIMIT,
      });
      set({
        posts: response.items,
        total: response.total,
        page: 1,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load posts';
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async () => {
    const { page, totalPages, countryScope, isLoadingMore, posts } = get();
    if (isLoadingMore || page >= totalPages) return;

    const nextPage = page + 1;
    set({ isLoadingMore: true });
    try {
      const response = await communityApi.getPosts({
        countryScope,
        page: nextPage,
        limit: DEFAULT_LIMIT,
      });
      set({
        posts: [...posts, ...response.items],
        page: nextPage,
        totalPages: response.totalPages,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  createPost: async (data) => {
    const post = await communityApi.createPost(data);
    // Prepend new post to the feed
    set((state) => ({ posts: [post, ...state.posts], total: state.total + 1 }));
    return post;
  },

  setCountryScope: (scope: string | undefined) => {
    set({ countryScope: scope });
  },

  updatePostLike: (postId: string, liked: boolean, likeCount: number) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likeCount, isLiked: liked } : p,
      ),
    }));
  },

  updatePostTranslation: (postId: string, translatedText: string) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, translatedText } : p,
      ),
    }));
  },
}));

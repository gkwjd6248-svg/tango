import { apiClient } from './client';

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
    avatarUrl?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const communityApi = {
  getPosts: async (params?: {
    countryScope?: string;
    page?: number;
    limit?: number;
    myPosts?: boolean;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<PaginatedResponse<Post>>('/posts', { params });
    return response.data;
  },

  createPost: async (data: {
    contentText: string;
    mediaUrls?: string[];
    postType?: string;
    countryScope?: string;
  }): Promise<Post> => {
    const response = await apiClient.post<Post>('/posts', data);
    return response.data;
  },

  getComments: async (
    postId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `/posts/${postId}/comments`,
      { params: { page, limit } },
    );
    return response.data;
  },

  createComment: async (
    postId: string,
    contentText: string,
    parentCommentId?: string,
  ): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/posts/${postId}/comments`, {
      contentText,
      parentCommentId,
    });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },

  toggleLike: async (
    likeableType: 'post' | 'comment',
    likeableId: string,
  ): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await apiClient.post<{ liked: boolean; likeCount: number }>(
      '/likes',
      { likeableType, likeableId },
    );
    return response.data;
  },

  checkLike: async (
    likeableType: 'post' | 'comment',
    likeableId: string,
  ): Promise<{ liked: boolean }> => {
    const response = await apiClient.get<{ liked: boolean }>('/likes/check', {
      params: { likeableType, likeableId },
    });
    return response.data;
  },

  translatePost: async (
    postId: string,
    targetLanguage: string,
  ): Promise<{ translatedText: string; targetLanguage: string }> => {
    const response = await apiClient.post<{ translatedText: string; targetLanguage: string }>(
      '/translations',
      { postId, targetLanguage },
    );
    return response.data;
  },

  getTranslation: async (
    postId: string,
    targetLanguage: string,
  ): Promise<{ translatedText: string } | null> => {
    try {
      const response = await apiClient.get<{ translatedText: string }>('/translations', {
        params: { postId, targetLanguage },
      });
      return response.data;
    } catch {
      return null;
    }
  },
};

import { QueryClient } from '@tanstack/react-query';
import type { LoginCredentials, RegisterCredentials, AuthTokens, User } from '../types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const tokens = localStorage.getItem('authTokens');
  if (tokens) {
    const parsed = JSON.parse(tokens);
    return parsed.accessToken;
  }
  return null;
};

// Helper function to make authenticated API calls
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
};

export const api = {
  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    return data.data;
  },

  async register(credentials: RegisterCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data = await response.json();
    return data.data;
  },

  async logout(): Promise<void> {
    await authenticatedFetch('/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<User> {
    return authenticatedFetch('/auth/me');
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Token refresh failed');
    }

    const data = await response.json();
    return data.data;
  },

  // Post endpoints
  async getPosts(params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return authenticatedFetch(`/posts?${queryParams.toString()}`);
  },

  async getPost(id: string): Promise<any> {
    return authenticatedFetch(`/posts/${id}`);
  },

  async createPost(data: { content: string; images?: string[] }): Promise<any> {
    return authenticatedFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deletePost(id: string): Promise<void> {
    return authenticatedFetch(`/posts/${id}`, { method: 'DELETE' });
  },

  async getUserPosts(userId: string, params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return authenticatedFetch(`/users/${userId}/posts?${queryParams.toString()}`);
  },

  // Comment endpoints
  async getPostComments(postId: string, params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return authenticatedFetch(`/posts/${postId}/comments?${queryParams.toString()}`);
  },

  async createComment(data: { postId: string; content: string }): Promise<any> {
    return authenticatedFetch('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteComment(id: string): Promise<void> {
    return authenticatedFetch(`/comments/${id}`, { method: 'DELETE' });
  },

  // Like endpoints
  async togglePostLike(postId: string): Promise<any> {
    return authenticatedFetch(`/likes/post/${postId}`, { method: 'POST' });
  },

  async toggleCommentLike(commentId: string): Promise<any> {
    return authenticatedFetch(`/likes/comment/${commentId}`, { method: 'POST' });
  },

  async getUserLikes(): Promise<any> {
    return authenticatedFetch('/likes/user');
  },

  // User endpoints
  async getUser(id: string): Promise<User> {
    return authenticatedFetch(`/users/${id}`);
  },

  async updateUser(id: string, data: { displayName?: string; bio?: string; profileImage?: string }): Promise<User> {
    return authenticatedFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getAllUsers(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return authenticatedFetch(`/users?${queryParams.toString()}`);
  },

  async banUser(id: string): Promise<void> {
    return authenticatedFetch(`/users/${id}/ban`, { method: 'PATCH' });
  },

  async unbanUser(id: string): Promise<void> {
    return authenticatedFetch(`/users/${id}/ban`, { method: 'PATCH' });
  },

  // Admin endpoints
  async getAdminStats(): Promise<any> {
    return authenticatedFetch('/admin/stats');
  },

  async getAdminUsers(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return authenticatedFetch(`/admin/users?${queryParams.toString()}`);
  },

  async getAdminPosts(params?: { page?: number; limit?: number; userId?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);

    return authenticatedFetch(`/admin/posts?${queryParams.toString()}`);
  },

  async getAdminComments(params?: { page?: number; limit?: number; userId?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);

    return authenticatedFetch(`/admin/comments?${queryParams.toString()}`);
  },

  // File upload endpoint
  async uploadImage(file: File): Promise<{ url: string }> {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.data;
  },
};
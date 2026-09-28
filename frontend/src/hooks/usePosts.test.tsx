import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosts, usePost, useCreatePost, useDeletePost, useUpdatePost, useUserPosts } from './usePosts';
import { api } from '../lib/api';

vi.mock('../lib/api');

describe('usePosts', () => {
  let queryClient: QueryClient;
  const mockedApi = vi.mocked(api);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePosts', () => {
    it('fetches posts successfully', async () => {
      const mockPosts = {
        success: true,
        data: {
          items: [{ id: '1', content: 'Test post' }],
          pagination: { total: 1, page: 1, totalPages: 1 },
        },
      };
      mockedApi.getPosts.mockResolvedValue(mockPosts);

      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockedApi.getPosts).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockPosts);
    });

    it('passes params to API call', async () => {
      const params = { page: 2, limit: 10, feed: 'following' as const };
      mockedApi.getPosts.mockResolvedValue({ success: true, data: { items: [], pagination: { total: 0, page: 1, totalPages: 1 } } });

      renderHook(() => usePosts(params), { wrapper });

      await waitFor(() => expect(mockedApi.getPosts).toHaveBeenCalledWith(params));
    });

    it('handles API errors', async () => {
      mockedApi.getPosts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePosts(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('can be disabled', () => {
      const { result } = renderHook(() => usePosts(undefined, false), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockedApi.getPosts).not.toHaveBeenCalled();
    });
  });

  describe('usePost', () => {
    it('fetches a single post successfully', async () => {
      const mockPost = {
        success: true,
        data: { id: '1', content: 'Test post' },
      };
      mockedApi.getPost.mockResolvedValue(mockPost);

      const { result } = renderHook(() => usePost('1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockedApi.getPost).toHaveBeenCalledWith('1');
      expect(result.current.data).toEqual(mockPost);
    });

    it('does not fetch when id is empty', () => {
      renderHook(() => usePost(''), { wrapper });

      expect(mockedApi.getPost).not.toHaveBeenCalled();
    });
  });

  describe('useCreatePost', () => {
    it('creates a post successfully', async () => {
      const newPost = { success: true, data: { id: '1', content: 'New post' } };
      mockedApi.createPost.mockResolvedValue(newPost);

      const { result } = renderHook(() => useCreatePost(), { wrapper });

      await result.current.mutateAsync({ content: 'New post' });

      expect(mockedApi.createPost).toHaveBeenCalledWith({ content: 'New post' });
    });

    it('handles creation errors', async () => {
      mockedApi.createPost.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCreatePost(), { wrapper });

      await expect(result.current.mutateAsync({ content: 'Test' })).rejects.toThrow('Creation failed');
    });
  });

  describe('useDeletePost', () => {
    it('deletes a post successfully', async () => {
      mockedApi.deletePost.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePost(), { wrapper });

      await result.current.mutateAsync('1');

      expect(mockedApi.deletePost).toHaveBeenCalledWith('1');
    });
  });

  describe('useUpdatePost', () => {
    it('updates a post successfully', async () => {
      const updatedPost = { success: true, data: { id: '1', content: 'Updated' } };
      mockedApi.updatePost.mockResolvedValue(updatedPost);

      const { result } = renderHook(() => useUpdatePost(), { wrapper });

      await result.current.mutateAsync({ id: '1', data: { content: 'Updated' } });

      expect(mockedApi.updatePost).toHaveBeenCalledWith('1', { content: 'Updated' });
    });

    it('updates query cache with new data', async () => {
      const updatedPost = { success: true, data: { id: '1', content: 'Updated' } };
      mockedApi.updatePost.mockResolvedValue(updatedPost);

      const { result } = renderHook(() => useUpdatePost(), { wrapper });

      await result.current.mutateAsync({ id: '1', data: { content: 'Updated' } });

      await waitFor(() => {
        expect(queryClient.getQueryData(['post', '1'])).toEqual(updatedPost);
      });
    });
  });

  describe('useUserPosts', () => {
    it('fetches user posts successfully', async () => {
      const mockPosts = {
        success: true,
        data: {
          items: [{ id: '1', content: 'User post' }],
          pagination: { total: 1, page: 1, totalPages: 1 },
        },
      };
      mockedApi.getUserPosts.mockResolvedValue(mockPosts);

      const { result } = renderHook(() => useUserPosts('user-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockedApi.getUserPosts).toHaveBeenCalledWith('user-1', undefined);
    });

    it('does not fetch when userId is empty', () => {
      renderHook(() => useUserPosts(''), { wrapper });

      expect(mockedApi.getUserPosts).not.toHaveBeenCalled();
    });

    it('passes params to API call', async () => {
      const params = { page: 2, limit: 10 };
      mockedApi.getUserPosts.mockResolvedValue({ success: true, data: { items: [], pagination: { total: 0, page: 1, totalPages: 1 } } });

      renderHook(() => useUserPosts('user-1', params), { wrapper });

      await waitFor(() => expect(mockedApi.getUserPosts).toHaveBeenCalledWith('user-1', params));
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePostComments, useCreateComment, useDeleteComment } from './useComments';
import { api } from '../lib/api';

vi.mock('../lib/api');

describe('useComments', () => {
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

  describe('usePostComments', () => {
    it('fetches post comments successfully', async () => {
      const mockComments = {
        success: true,
        data: {
          items: [{ id: '1', content: 'Test comment' }],
          pagination: { total: 1, page: 1, totalPages: 1 },
        },
      };
      mockedApi.getPostComments.mockResolvedValue(mockComments);

      const { result } = renderHook(() => usePostComments('post-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockedApi.getPostComments).toHaveBeenCalledWith('post-1', undefined);
      expect(result.current.data).toEqual(mockComments);
    });

    it('passes params to API call', async () => {
      const params = { page: 2, limit: 10, parentId: 'comment-1' };
      mockedApi.getPostComments.mockResolvedValue({ success: true, data: { items: [], pagination: { total: 0, page: 1, totalPages: 1 } } });

      renderHook(() => usePostComments('post-1', params), { wrapper });

      await waitFor(() => expect(mockedApi.getPostComments).toHaveBeenCalledWith('post-1', params));
    });

    it('does not fetch when postId is empty', () => {
      renderHook(() => usePostComments(''), { wrapper });

      expect(mockedApi.getPostComments).not.toHaveBeenCalled();
    });

    it('can be disabled via params', () => {
      renderHook(() => usePostComments('post-1', { enabled: false }), { wrapper });

      expect(mockedApi.getPostComments).not.toHaveBeenCalled();
    });

    it('handles API errors', async () => {
      mockedApi.getPostComments.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePostComments('post-1'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCreateComment', () => {
    it('creates a comment successfully', async () => {
      const newComment = { success: true, data: { id: '1', content: 'New comment' } };
      mockedApi.createComment.mockResolvedValue(newComment);

      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await result.current.mutateAsync({ postId: 'post-1', content: 'New comment' });

      expect(mockedApi.createComment).toHaveBeenCalledWith({ postId: 'post-1', content: 'New comment' });
    });

    it('creates a reply successfully', async () => {
      const newComment = { success: true, data: { id: '1', content: 'Reply' } };
      mockedApi.createComment.mockResolvedValue(newComment);

      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await result.current.mutateAsync({ postId: 'post-1', content: 'Reply', parentId: 'comment-1' });

      expect(mockedApi.createComment).toHaveBeenCalledWith({ postId: 'post-1', content: 'Reply', parentId: 'comment-1' });
    });

    it('handles creation errors', async () => {
      mockedApi.createComment.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateComment(), { wrapper });

      await expect(result.current.mutateAsync({ postId: 'post-1', content: 'Test' })).rejects.toThrow('Creation failed');
    });
  });

  describe('useDeleteComment', () => {
    it('deletes a comment successfully', async () => {
      mockedApi.deleteComment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteComment(), { wrapper });

      await result.current.mutateAsync('comment-1');

      expect(mockedApi.deleteComment).toHaveBeenCalledWith('comment-1');
    });

    it('handles deletion errors', async () => {
      mockedApi.deleteComment.mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(() => useDeleteComment(), { wrapper });

      await expect(result.current.mutateAsync('comment-1')).rejects.toThrow('Deletion failed');
    });
  });
});

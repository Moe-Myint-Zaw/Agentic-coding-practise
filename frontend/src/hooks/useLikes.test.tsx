import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useTogglePostLike, useToggleCommentLike, useUserLikes } from './useLikes';
import { api } from '../lib/api';

vi.mock('../lib/api');

describe('useLikes', () => {
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

  describe('useTogglePostLike', () => {
    it('toggles post like successfully', async () => {
      const result = { success: true, data: { liked: true } };
      mockedApi.togglePostLike.mockResolvedValue(result);

      const { result: hookResult } = renderHook(() => useTogglePostLike(), { wrapper });

      await hookResult.current.mutateAsync('post-1');

      expect(mockedApi.togglePostLike).toHaveBeenCalledWith('post-1');
    });

    it('handles toggle errors', async () => {
      mockedApi.togglePostLike.mockRejectedValue(new Error('Toggle failed'));

      const { result: hookResult } = renderHook(() => useTogglePostLike(), { wrapper });

      await expect(hookResult.current.mutateAsync('post-1')).rejects.toThrow('Toggle failed');
    });
  });

  describe('useToggleCommentLike', () => {
    it('toggles comment like successfully', async () => {
      const result = { success: true, data: { liked: true } };
      mockedApi.toggleCommentLike.mockResolvedValue(result);

      const { result: hookResult } = renderHook(() => useToggleCommentLike(), { wrapper });

      await hookResult.current.mutateAsync('comment-1');

      expect(mockedApi.toggleCommentLike).toHaveBeenCalledWith('comment-1');
    });

    it('handles toggle errors', async () => {
      mockedApi.toggleCommentLike.mockRejectedValue(new Error('Toggle failed'));

      const { result: hookResult } = renderHook(() => useToggleCommentLike(), { wrapper });

      await expect(hookResult.current.mutateAsync('comment-1')).rejects.toThrow('Toggle failed');
    });
  });

  describe('useUserLikes', () => {
    it('fetches user likes successfully', async () => {
      const mockLikes = {
        success: true,
        data: {
          items: [{ id: '1', type: 'post', targetId: 'post-1' }],
          pagination: { total: 1, page: 1, totalPages: 1 },
        },
      };
      mockedApi.getUserLikes.mockResolvedValue(mockLikes);

      const { result } = renderHook(() => useUserLikes(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockedApi.getUserLikes).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockLikes);
    });

    it('handles API errors', async () => {
      mockedApi.getUserLikes.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserLikes(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});

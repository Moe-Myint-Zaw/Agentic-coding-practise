import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications, notificationQueryKey } from './useNotifications';
import { api } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'test-token' },
    user: { id: 'test-user' },
  }),
}));

const mockNotifications = {
  items: [],
  unreadCount: 1,
  pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
};

class MockWebSocket {
  public static instances: MockWebSocket[] = [];
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public close = vi.fn();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
}

describe('useNotifications', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    // @ts-expect-error - Mocking WebSocket for testing
    globalThis.WebSocket = MockWebSocket;
    vi.spyOn(api, 'getNotifications').mockResolvedValue(mockNotifications);
  });

  it('refetches notifications when a socket notification arrives', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

    const TestComponent = () => {
      useNotifications();
      return null;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(api.getNotifications).toHaveBeenCalled());

    const socket = MockWebSocket.instances[0];
    socket.onmessage?.({ data: JSON.stringify({ type: 'notification.created' }) } as MessageEvent);

    await waitFor(() => {
      expect(refetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: notificationQueryKey('test-user'), exact: false, type: 'active' }),
      );
    });
  });

  it('loads the requested page into a user-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const TestComponent = () => {
      useNotifications(2);
      return null;
    };

    render(<QueryClientProvider client={queryClient}><TestComponent /></QueryClientProvider>);

    await waitFor(() => expect(api.getNotifications).toHaveBeenCalledWith({ page: 2, limit: 50 }));
    expect(queryClient.getQueryCache().getAll().map(({ queryKey }) => queryKey)).toContainEqual([
      ...notificationQueryKey('test-user'),
      2,
    ]);
  });

  it('invalidates shared content queries when a content update arrives', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const TestComponent = () => {
      useNotifications();
      return null;
    };

    render(<StrictMode><QueryClientProvider client={queryClient}><TestComponent /></QueryClientProvider></StrictMode>);
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];
    socket.onmessage?.({ data: JSON.stringify({ type: 'content.updated', data: { resource: 'comment', action: 'created', postId: 'post-1', commentId: 'comment-1', actorId: 'user-2' } }) } as MessageEvent);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['posts'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['post', 'post-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['postComments', 'post-1'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['search'] });
    });
  });
});

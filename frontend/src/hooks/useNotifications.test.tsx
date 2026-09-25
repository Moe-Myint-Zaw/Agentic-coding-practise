import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications, notificationQueryKey } from './useNotifications';
import { api } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'test-token' },
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
    vi.stubGlobal('WebSocket', MockWebSocket as any);
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
        expect.objectContaining({ queryKey: notificationQueryKey, exact: false, type: 'active' }),
      );
    });
  });
});

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ORIGIN } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';

export const notificationQueryKey = ['notifications'];

export const useNotifications = () => {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: notificationQueryKey,
    queryFn: () => api.getNotifications({ page: 1, limit: 50 }),
    enabled: Boolean(tokens),
  });

  useEffect(() => {
    if (!tokens?.accessToken) return undefined;
    const origin = new URL(API_ORIGIN);
    const protocol = origin.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${origin.host}/ws?token=${encodeURIComponent(tokens.accessToken)}`);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string; data?: Notification };
        if (message.type === 'notification.created') {
          queryClient.invalidateQueries({ queryKey: notificationQueryKey });
        }
      } catch {
        // Ignore malformed socket messages and keep the connection alive.
      }
    };
    return () => socket.close();
  }, [queryClient, tokens?.accessToken]);

  const markRead = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  });
  const markAllRead = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  });

  return { ...query, markRead, markAllRead, unreadCount: query.data?.unreadCount ?? 0 };
};
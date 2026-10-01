import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ORIGIN } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';

export const notificationQueryKey = (userId: string | undefined) => ['notifications', userId] as const;

interface ContentUpdateMessage {
  postId: string;
  commentId?: string;
}

export const useNotifications = (page = 1) => {
  const { tokens, user } = useAuth();
  const userId = user?.id;
  const userQueryKey = notificationQueryKey(userId);
  const queryClient = useQueryClient();

  const refreshNotifications = async () => {
    await queryClient.refetchQueries({
      queryKey: userQueryKey,
      exact: false,
      type: 'active',
    });
  };

  const query = useQuery({
    queryKey: [...userQueryKey, page],
    queryFn: () => api.getNotifications({ page, limit: 50 }),
    enabled: Boolean(tokens?.accessToken && userId),
  });

  useEffect(() => {
    if (!tokens?.accessToken) return undefined;
    let cancelled = false;
    let socket: WebSocket | null = null;

    queueMicrotask(() => {
      if (cancelled) return;
      const origin = new URL(API_ORIGIN);
      const protocol = origin.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${origin.host}/ws?token=${encodeURIComponent(tokens.accessToken)}`);
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { type?: string; data?: Notification };
          if (message.type === 'notification.created') {
            void refreshNotifications();
          } else if (message.type === 'content.updated' && message.data && 'postId' in message.data) {
            const update = message.data as ContentUpdateMessage;
            void Promise.all([
              queryClient.invalidateQueries({ queryKey: ['posts'] }),
              queryClient.invalidateQueries({ queryKey: ['userPosts'] }),
              queryClient.invalidateQueries({ queryKey: ['search'] }),
              queryClient.invalidateQueries({ queryKey: ['user'] }),
            ]);
            void queryClient.invalidateQueries({ queryKey: ['post', update.postId] });
            void queryClient.invalidateQueries({ queryKey: ['postComments', update.postId] });
          }
        } catch {
          // Ignore malformed socket messages and keep the connection alive.
        }
      };
    });

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [queryClient, tokens?.accessToken]);

  const markRead = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => { void refreshNotifications(); },
  });
  const markAllRead = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => { void refreshNotifications(); },
  });

  return { ...query, userId, markRead, markAllRead, unreadCount: query.data?.unreadCount ?? 0 };
};
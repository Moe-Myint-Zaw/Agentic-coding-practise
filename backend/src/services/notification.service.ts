import prisma from '../config/database';
import { broadcastNotification } from '../realtime/websocket';

export type NotificationType = 'POST_LIKED' | 'COMMENT_LIKED' | 'COMMENT_CREATED' | 'FOLLOWED';

export interface CreateNotificationInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

interface NotificationRecord {
  id: string;
  type: string;
  postId: string | null;
  commentId: string | null;
  readAt: Date | null;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
}

export const createNotification = async (input: CreateNotificationInput) => {
  if (input.recipientId === input.actorId) return null;

  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId,
      commentId: input.commentId,
    },
    include: {
      actor: { select: { id: true, username: true, displayName: true, profileImage: true } },
    },
  });

  const serialized = serializeNotification(notification);
  broadcastNotification(input.recipientId, serialized);
  return serialized;
};

export const getNotifications = async (recipientId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId },
      include: { actor: { select: { id: true, username: true, displayName: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId } }),
    prisma.notification.count({ where: { recipientId, readAt: null } }),
  ]);

  return {
    items: items.map(serializeNotification),
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const markNotificationRead = async (id: string, recipientId: string) => {
  const result = await prisma.notification.updateMany({
    where: { id, recipientId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count > 0 };
};

export const markAllNotificationsRead = async (recipientId: string) => {
  const result = await prisma.notification.updateMany({
    where: { recipientId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updatedCount: result.count };
};

const serializeNotification = (notification: NotificationRecord) => ({
  id: notification.id,
  type: notification.type,
  postId: notification.postId,
  commentId: notification.commentId,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  actor: notification.actor,
});
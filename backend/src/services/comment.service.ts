import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { createNotification } from './notification.service';
import { broadcastContentUpdate } from '../realtime/websocket';

interface CommentWithIncludes {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
  likes: Array<{ userId: string }>;
  _count?: {
    likes: number;
    replies: number;
  };
}

export const getCommentsByPost = async (postId: string, page = 1, limit = 10, parentId: string | null = null) => {
  const skip = (page - 1) * limit;
  const where = {
    postId,
    parentId,
    OR: [{ isDeleted: false }, { replies: { some: {} } }],
  };
  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, displayName: true, profileImage: true } },
        likes: true,
        _count: { select: { likes: true, replies: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    items: items.map((comment) => serializeComment(comment)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createComment = async (input: { content: string; postId: string; userId: string; parentId?: string }) => {
  const post = await prisma.post.findUnique({ where: { id: input.postId } });
  if (!post || post.isDeleted) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');

  const parent = input.parentId
    ? await prisma.comment.findUnique({ where: { id: input.parentId } })
    : null;
  if (input.parentId) {
    if (!parent || parent.postId !== input.postId || parent.isDeleted) {
      throw new ApiError('Parent comment is invalid', 400, 'INVALID_PARENT_COMMENT');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: input.content,
      postId: input.postId,
      authorId: input.userId,
      parentId: input.parentId,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, profileImage: true } },
      likes: true,
      _count: { select: { likes: true, replies: true } },
    },
  });
  broadcastContentUpdate({ resource: 'comment', action: 'created', postId: input.postId, commentId: comment.id });
  await createNotification({
    recipientId: parent?.authorId ?? post.authorId,
    actorId: input.userId,
    type: 'COMMENT_CREATED',
    postId: input.postId,
    commentId: comment.id,
  });

  return serializeComment(comment);
};

export const deleteComment = async (id: string, userId: string, userRole: 'USER' | 'ADMIN') => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError('Comment not found', 404, 'COMMENT_NOT_FOUND');

  if (comment.authorId !== userId && userRole !== 'ADMIN') {
    throw new ApiError('You can only delete your own comment', 403, 'FORBIDDEN');
  }

  await prisma.comment.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
  });

  broadcastContentUpdate({ resource: 'comment', action: 'deleted', postId: comment.postId, commentId: id });
  return { deleted: true };
};

const serializeComment = (comment: CommentWithIncludes) => ({
  id: comment.id,
  content: comment.isDeleted ? '' : comment.content,
  postId: comment.postId,
  parentId: comment.parentId,
  authorId: comment.authorId,
  author: comment.author,
  isDeleted: comment.isDeleted,
  deletedAt: comment.deletedAt,
  deletedBy: comment.deletedBy,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  likes: comment.isDeleted ? [] : comment.likes || [],
  _count: {
    likes: comment.isDeleted ? 0 : comment._count?.likes ?? comment.likes?.length ?? 0,
    replies: comment._count?.replies ?? 0,
  },
});

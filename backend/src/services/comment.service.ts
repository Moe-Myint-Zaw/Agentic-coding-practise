import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { createNotification } from './notification.service';

export const getCommentsByPost = async (postId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId, isDeleted: false },
      include: { author: true, likes: true },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { postId, isDeleted: false } }),
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

export const createComment = async (input: { content: string; postId: string; userId: string }) => {
  const post = await prisma.post.findUnique({ where: { id: input.postId } });
  if (!post || post.isDeleted) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');

  const comment = await prisma.comment.create({
    data: {
      content: input.content,
      postId: input.postId,
      authorId: input.userId,
    },
    include: { author: true, likes: true },
  });
  await createNotification({
    recipientId: post.authorId,
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

  return { deleted: true };
};

const serializeComment = (comment: any) => ({
  id: comment.id,
  content: comment.content,
  postId: comment.postId,
  authorId: comment.authorId,
  author: comment.author,
  isDeleted: comment.isDeleted,
  deletedAt: comment.deletedAt,
  deletedBy: comment.deletedBy,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  likes: comment.likes || [],
  _count: { likes: comment.likes?.length || 0 },
});

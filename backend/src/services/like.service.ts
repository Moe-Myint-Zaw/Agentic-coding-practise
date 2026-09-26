import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { createNotification } from './notification.service';
import { broadcastContentUpdate } from '../realtime/websocket';

export const togglePostLike = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.isDeleted) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');

  const existing = await prisma.like.findFirst({
    where: { userId, postId },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    broadcastContentUpdate({ resource: 'post-like', action: 'unliked', postId });
    return { liked: false, postId };
  }

  const created = await prisma.like.create({
    data: { userId, postId },
  });
  broadcastContentUpdate({ resource: 'post-like', action: 'liked', postId });
  await createNotification({ recipientId: post.authorId, actorId: userId, type: 'POST_LIKED', postId });

  return { liked: true, likeId: created.id, postId };
};

export const toggleCommentLike = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.isDeleted) throw new ApiError('Comment not found', 404, 'COMMENT_NOT_FOUND');

  const existing = await prisma.like.findFirst({
    where: { userId, commentId },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    broadcastContentUpdate({ resource: 'comment-like', action: 'unliked', postId: comment.postId, commentId });
    return { liked: false, commentId };
  }

  const created = await prisma.like.create({
    data: { userId, commentId },
  });
  broadcastContentUpdate({ resource: 'comment-like', action: 'liked', postId: comment.postId, commentId });
  await createNotification({ recipientId: comment.authorId, actorId: userId, type: 'COMMENT_LIKED', postId: comment.postId, commentId });

  return { liked: true, likeId: created.id, commentId };
};

export const getUserLikes = async (userId: string) => {
  const likes = await prisma.like.findMany({
    where: { userId },
    include: { post: { include: { author: true } }, comment: { include: { author: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return likes.map((like) => ({
    id: like.id,
    userId: like.userId,
    postId: like.postId,
    commentId: like.commentId,
    post: like.post,
    comment: like.comment,
    createdAt: like.createdAt,
  }));
};

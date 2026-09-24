import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';

export type FeedType = 'latest' | 'following';

export const getPosts = async (page = 1, limit = 20, feed: FeedType = 'latest', userId?: string) => {
  const skip = (page - 1) * limit;
  const where = feed === 'following'
    ? { isDeleted: false, author: { followers: { some: { followerId: userId } } } }
    : { isDeleted: false };
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: true,
        comments: { where: { isDeleted: false } },
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: items.map((post) => serializePost(post)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPostById = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id, isDeleted: false },
    include: {
      author: true,
      comments: {
        where: { isDeleted: false },
        include: { author: true, likes: true },
      },
      likes: true,
    },
  });

  if (!post) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');
  return serializePost(post);
};

export const createPost = async (input: { content: string; images?: string[]; userId: string }) => {
  if (!input.content && (!input.images || input.images.length === 0)) {
    throw new ApiError('Post content or image is required', 400, 'POST_CONTENT_REQUIRED');
  }

  const post = await prisma.post.create({
    data: {
      content: input.content || '',
      images: JSON.stringify(input.images || []),
      authorId: input.userId,
    },
    include: { author: true, comments: true, likes: true },
  });

  return serializePost(post);
};

export const deletePost = async (id: string, userId: string, userRole: 'USER' | 'ADMIN') => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');

  if (post.authorId !== userId && userRole !== 'ADMIN') {
    throw new ApiError('You can only delete your own post', 403, 'FORBIDDEN');
  }

  await prisma.post.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
  });

  return { deleted: true };
};

export const updatePost = async (
  id: string,
  userId: string,
  input: { content?: string; images?: string[] },
) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError('Post not found', 404, 'POST_NOT_FOUND');
  if (post.authorId !== userId) {
    throw new ApiError('You can only edit your own post', 403, 'FORBIDDEN');
  }
  if (Date.now() - post.createdAt.getTime() > 24 * 60 * 60 * 1000) {
    throw new ApiError('Posts can only be edited within 24 hours', 403, 'POST_EDIT_EXPIRED');
  }

  const content = input.content ?? post.content;
  const images = input.images ?? parseImages(post.images);
  if (!content.trim() && images.length === 0) {
    throw new ApiError('Post content or image is required', 400, 'POST_CONTENT_REQUIRED');
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { content, images: JSON.stringify(images) },
    include: { author: true, comments: true, likes: true },
  });

  return serializePost(updatedPost);
};

export const getUserPosts = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, isDeleted: false },
      include: { author: true, comments: true, likes: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { authorId: userId, isDeleted: false } }),
  ]);

  return {
    items: items.map((post) => serializePost(post)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const serializePost = (post: any) => ({
  id: post.id,
  content: post.content,
  images: parseImages(post.images),
  authorId: post.authorId,
  author: post.author,
  isDeleted: post.isDeleted,
  deletedAt: post.deletedAt,
  deletedBy: post.deletedBy,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  comments: post.comments?.map((comment: any) => serializeComment(comment)) || [],
  likes: post.likes || [],
  _count: {
    comments: post.comments?.length || 0,
    likes: post.likes?.length || 0,
  },
});

const parseImages = (images: string | string[] | null | undefined) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof images === 'string' && images.length > 0 ? [images] : [];
  }
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

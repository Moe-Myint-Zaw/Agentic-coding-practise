import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
      comments: { where: { isDeleted: false } },
      likes: true,
    },
  });

  if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    profileImage: user.profileImage,
    role: user.role,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    postCount: user.posts.length,
    posts: user.posts,
  };
};

export const updateUser = async (id: string, data: { displayName?: string; bio?: string; profileImage?: string }) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  const updated = await prisma.user.update({
    where: { id },
    data: {
      displayName: data.displayName ?? existing.displayName,
      bio: data.bio ?? existing.bio,
      profileImage: data.profileImage ?? existing.profileImage,
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    displayName: updated.displayName,
    bio: updated.bio,
    profileImage: updated.profileImage,
    role: updated.role,
    isBanned: updated.isBanned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
};

export const listUsers = async (page = 1, limit = 20, search = '') => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: search ? {
        OR: [{ username: { contains: search } }, { email: { contains: search } }],
      } : undefined,
      include: { posts: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: search ? {
        OR: [{ username: { contains: search } }, { email: { contains: search } }],
      } : undefined,
    }),
  ]);

  return {
    items: items.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      postCount: user.posts.length,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const banUser = async (id: string, isBanned: boolean) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  await prisma.user.update({ where: { id }, data: { isBanned } });
  return { id, isBanned };
};

import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { createNotification } from './notification.service';

export const getUserById = async (id: string, viewerId?: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
      comments: { where: { isDeleted: false } },
      likes: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  const follow = viewerId && viewerId !== id
    ? await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: id } } })
    : null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    profileImage: user.profileImage,
    coverImage: user.coverImage,
    role: user.role,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    postCount: user.posts.length,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: Boolean(follow),
    posts: user.posts,
  };
};

export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) throw new ApiError('You cannot follow yourself', 400, 'SELF_FOLLOW');

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
  if (!existing) {
    await createNotification({ recipientId: followingId, actorId: followerId, type: 'FOLLOWED' });
  }

  return { following: true, userId: followingId };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  await prisma.follow.deleteMany({ where: { followerId, followingId } });
  return { following: false, userId: followingId };
};

export const updateUser = async (id: string, data: { displayName?: string; bio?: string; profileImage?: string; coverImage?: string }) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  const updated = await prisma.user.update({
    where: { id },
    data: {
      displayName: data.displayName ?? existing.displayName,
      bio: data.bio ?? existing.bio,
      profileImage: data.profileImage ?? existing.profileImage,
      coverImage: data.coverImage ?? existing.coverImage,
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    username: updated.username,
    displayName: updated.displayName,
    bio: updated.bio,
    profileImage: updated.profileImage,
    coverImage: updated.coverImage,
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
      coverImage: user.coverImage,
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

export const searchUsers = async (query: string, viewerId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const where = {
    OR: [
      { username: { contains: query } },
      { displayName: { contains: query } },
    ],
  };

  const [users, total, following] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        profileImage: true,
        coverImage: true,
        createdAt: true,
        _count: { select: { followers: true, following: true } },
      },
      skip,
      take: limit,
      orderBy: { username: 'asc' },
    }),
    prisma.user.count({ where }),
    prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    }),
  ]);

  const followingIds = new Set(following.map((item) => item.followingId));

  return {
    items: users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
      createdAt: user.createdAt,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing: followingIds.has(user.id),
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

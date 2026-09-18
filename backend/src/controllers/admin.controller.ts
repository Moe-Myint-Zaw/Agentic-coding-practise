import { NextFunction, Request, Response } from 'express';
import prisma from '../config/database';

export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalPosts, totalComments, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { isDeleted: false } }),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isBanned: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalComments,
        activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '');
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
      prisma.user.count({ where: search ? {
        OR: [{ username: { contains: search } }, { email: { contains: search } }],
      } : undefined }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map((u) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          displayName: u.displayName,
          bio: u.bio,
          profileImage: u.profileImage,
          role: u.role,
          isBanned: u.isBanned,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          postCount: u.posts.length,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const userId = String(req.query.userId || '');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where: userId ? { authorId: userId } : {},
        include: { author: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: userId ? { authorId: userId } : {} }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map((post) => ({
          id: post.id,
          content: post.content,
          images: post.images,
          authorId: post.authorId,
          author: post.author,
          isDeleted: post.isDeleted,
          deletedAt: post.deletedAt,
          deletedBy: post.deletedBy,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const userId = String(req.query.userId || '');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: userId ? { authorId: userId } : {},
        include: { author: true, post: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: userId ? { authorId: userId } : {} }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map((comment) => ({
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
          post: comment.post,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

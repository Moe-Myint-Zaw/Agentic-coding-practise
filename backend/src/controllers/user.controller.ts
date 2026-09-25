import { NextFunction, Request, Response } from 'express';
import { banUser, followUser, getUserById, listUsers, searchUsers, unfollowUser, updateUser } from '../services/user.service';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getUserById(userId, req.user?.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const follow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await followUser(req.user!.userId, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const unfollow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await unfollowUser(req.user!.userId, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await updateUser(userId, {
      displayName: req.body.displayName,
      bio: req.body.bio,
      profileImage: req.body.profileImage,
      coverImage: req.body.coverImage,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listUsersByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '');
    const result = await listUsers(page, limit, search);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const searchUsersForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query must be at least 2 characters', code: 'INVALID_SEARCH_QUERY' },
      });
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const result = await searchUsers(query, req.user!.userId, page, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const ban = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await banUser(userId, req.body.isBanned ?? true);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, refreshUserTokens } from '../services/auth.service';
import { ApiError } from '../middleware/error.middleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('register controller caught error:', error);
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await refreshUserTokens(req.body.refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError('Unauthorized', 401, 'NO_TOKEN');

    const user = await (await import('../config/database')).default.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

    res.status(200).json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

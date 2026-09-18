import { NextFunction, Request, Response } from 'express';
import { banUser, getUserById, listUsers, updateUser } from '../services/user.service';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getUserById(userId);
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

export const ban = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await banUser(userId, req.body.isBanned ?? true);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

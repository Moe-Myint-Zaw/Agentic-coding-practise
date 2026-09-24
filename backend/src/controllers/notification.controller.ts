import { NextFunction, Request, Response } from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notification.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const result = await getNotifications(req.user!.userId, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await markNotificationRead(id, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await markAllNotificationsRead(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
import { NextFunction, Request, Response } from 'express';
import { searchContent } from '../services/search.service';

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query must be at least 2 characters', code: 'INVALID_SEARCH_QUERY' },
      });
    }

    const page = parsePositiveInteger(req.query.page, 1);
    const postsPage = parsePositiveInteger(req.query.postsPage, page);
    const commentsPage = parsePositiveInteger(req.query.commentsPage, page);
    const limit = Math.min(50, parsePositiveInteger(req.query.limit, 20));
    const result = await searchContent(query, req.user!.userId, page, postsPage, commentsPage, limit);
    return res.status(200).json({ success: true, data: { query, ...result } });
  } catch (error) {
    return next(error);
  }
};

const parsePositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
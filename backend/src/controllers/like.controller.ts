import { NextFunction, Request, Response } from 'express';
import { getUserLikes, toggleCommentLike, togglePostLike } from '../services/like.service';

export const togglePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
    const result = await togglePostLike(postId, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const toggleComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
    const result = await toggleCommentLike(commentId, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listLiked = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getUserLikes(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

import { NextFunction, Request, Response } from 'express';
import { createComment, deleteComment, getCommentsByPost } from '../services/comment.service';

export const listComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
    const result = await getCommentsByPost(postId, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createComment({
      content: req.body.content,
      postId: req.body.postId,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteComment(commentId, req.user!.userId, req.user!.role);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

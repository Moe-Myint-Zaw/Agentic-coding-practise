import { body, ValidationChain } from 'express-validator';

export const commentValidator: ValidationChain[] = [
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 300 }).withMessage('Comment must be 300 characters or less'),
  body('postId').trim().notEmpty().withMessage('Post id is required'),
  body('parentId').optional().isString().trim().notEmpty().withMessage('Parent comment id must not be empty'),
];

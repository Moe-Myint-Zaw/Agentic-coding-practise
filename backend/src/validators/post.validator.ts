import { body, ValidationChain } from 'express-validator';

export const postValidator: ValidationChain[] = [
  body('content').optional().isLength({ max: 500 }).withMessage('Content must be 500 characters or less'),
  body('images').optional().isArray({ max: 5 }).withMessage('Maximum 5 images are allowed'),
];

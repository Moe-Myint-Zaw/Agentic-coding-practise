import { body, ValidationChain } from 'express-validator';

export const profileValidator: ValidationChain[] = [
  body('displayName').optional().trim().isLength({ max: 50 }).withMessage('Display name must be 50 characters or less'),
  body('bio').optional().trim().isLength({ max: 160 }).withMessage('Bio must be 160 characters or less'),
  body('profileImage').optional().isString().withMessage('Profile image must be a string'),
  body('coverImage').optional().isString().withMessage('Cover image must be a string'),
];

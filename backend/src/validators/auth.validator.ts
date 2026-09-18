import { body, ValidationChain } from 'express-validator';

export const registerValidator: ValidationChain[] = [
  body('email').trim().isEmail().withMessage('Invalid email format').normalizeEmail(),
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

export const loginValidator: ValidationChain[] = [
  body('email').trim().notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

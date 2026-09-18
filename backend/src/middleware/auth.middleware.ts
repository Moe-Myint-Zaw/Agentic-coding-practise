import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { JWTPayload } from '../types';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided',
          code: 'NO_TOKEN',
        },
      });
    }

    const decoded = verifyAccessToken(token) as JWTPayload;
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }
};

export const authorize = (roles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JWTPayload | undefined;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
      });
    }

    return next();
  };
};

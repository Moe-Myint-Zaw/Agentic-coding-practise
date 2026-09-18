import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';

export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (err instanceof Error) {
    console.error(err.stack || err.message);
  }

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image size must be 5MB or less'
      : 'Image upload failed';
    return res.status(400).json({
      success: false,
      error: { message, code: 'UPLOAD_FAILED' },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};

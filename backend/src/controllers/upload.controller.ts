import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error.middleware';

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError('Image upload failed', 400, 'UPLOAD_FAILED');
    }

    const url = `/uploads/${file.filename}`;
    res.status(201).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};

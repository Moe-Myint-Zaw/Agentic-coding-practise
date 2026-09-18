import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/image', authenticate, upload.single('image'), uploadImage);

export default router;

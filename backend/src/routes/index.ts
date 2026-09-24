import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';
import likeRoutes from './like.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/likes', likeRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);

export default router;

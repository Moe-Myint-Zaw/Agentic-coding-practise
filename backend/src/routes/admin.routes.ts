import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAdminComments, getAdminPosts, getAdminStats, getAdminUsers } from '../controllers/admin.controller';

const router = Router();

router.get('/stats', authenticate, authorize(['ADMIN']), getAdminStats);
router.get('/users', authenticate, authorize(['ADMIN']), getAdminUsers);
router.get('/posts', authenticate, authorize(['ADMIN']), getAdminPosts);
router.get('/comments', authenticate, authorize(['ADMIN']), getAdminComments);

export default router;

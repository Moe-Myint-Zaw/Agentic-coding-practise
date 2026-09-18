import { Router } from 'express';
import { listLiked, toggleComment, togglePost } from '../controllers/like.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/post/:postId', authenticate, togglePost);
router.post('/comment/:commentId', authenticate, toggleComment);
router.get('/user', authenticate, listLiked);

export default router;

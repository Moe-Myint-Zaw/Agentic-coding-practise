import { Router } from 'express';
import { listComments, create, remove } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/post/:postId', authenticate, listComments);
router.post('/', authenticate, create);
router.delete('/:id', authenticate, remove);

export default router;

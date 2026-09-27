import { Router } from 'express';
import { listComments, create, remove } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { commentValidator } from '../validators/comment.validator';

const router = Router();

router.get('/post/:postId', authenticate, listComments);
router.post('/', authenticate, commentValidator, validateRequest, create);
router.delete('/:id', authenticate, remove);

export default router;

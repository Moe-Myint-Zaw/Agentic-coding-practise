import { Router } from 'express';
import { listPosts, getPost, create, update, remove, listUserPosts } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { listComments } from '../controllers/comment.controller';
import { postValidator } from '../validators/post.validator';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

router.get('/', authenticate, listPosts);
router.post('/', authenticate, create);
router.put('/:id', authenticate, postValidator, validateRequest, update);
router.get('/:id/comments', authenticate, listComments);
router.get('/user/:userId/posts', authenticate, listUserPosts);
router.get('/:id', authenticate, getPost);
router.delete('/:id', authenticate, remove);

export default router;

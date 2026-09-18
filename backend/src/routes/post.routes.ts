import { Router } from 'express';
import { listPosts, getPost, create, remove, listUserPosts } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { listComments } from '../controllers/comment.controller';

const router = Router();

router.get('/', authenticate, listPosts);
router.post('/', authenticate, create);
router.get('/:id/comments', authenticate, listComments);
router.get('/user/:userId/posts', authenticate, listUserPosts);
router.get('/:id', authenticate, getPost);
router.delete('/:id', authenticate, remove);

export default router;

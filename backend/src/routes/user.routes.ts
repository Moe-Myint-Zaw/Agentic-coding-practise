import { Router } from 'express';
import { ban, follow, getUser, listUsersByAdmin, searchUsersForUser, unfollow, updateProfile } from '../controllers/user.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN']), listUsersByAdmin);
router.get('/search', authenticate, searchUsersForUser);
router.get('/:id/posts', async (req, res, next) => {
  try {
    const { getUserPosts } = await import('../services/post.service');
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getUserPosts(userId, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
router.get('/:id', optionalAuthenticate, getUser);
router.post('/:id/follow', authenticate, follow);
router.delete('/:id/follow', authenticate, unfollow);
router.put('/:id', authenticate, updateProfile);
router.patch('/:id/ban', authenticate, authorize(['ADMIN']), ban);

export default router;

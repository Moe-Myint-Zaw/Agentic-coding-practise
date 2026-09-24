import { Router } from 'express';
import { list, markAllRead, markRead } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.post('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
import { Router } from 'express';
import { register, login, refresh, me } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validator';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../config/rateLimit';

const router = Router();

router.post('/register', authRateLimiter, registerValidator, validateRequest, register);
router.post('/login', authRateLimiter, loginValidator, validateRequest, login);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

export default router;

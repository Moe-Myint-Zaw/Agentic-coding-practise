import rateLimit from 'express-rate-limit';
import env from './env';

export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts',
      code: 'RATE_LIMITED',
    },
  },
});

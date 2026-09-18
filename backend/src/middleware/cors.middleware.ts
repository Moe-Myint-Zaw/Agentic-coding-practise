import cors from 'cors';
import env from '../config/env';

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

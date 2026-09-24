import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(32).default('replace-with-a-long-jwt-secret-key-1234'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32).default('replace-with-a-long-refresh-secret-key-1234'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(process.env.NODE_ENV === 'production' ? 5 : 100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
});

const env = envSchema.parse(process.env);

export default env;

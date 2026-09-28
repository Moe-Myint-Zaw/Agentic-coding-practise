import request from 'supertest';
import app from '../app';
import { server } from '../app';
import prisma from '../config/database';

describe('Rate limiting', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  });

  describe('Authentication rate limiting', () => {
    it('allows authentication requests within limit', async () => {
      // In test environment, limit is 100 attempts per 15 minutes
      // We'll test with a few attempts to verify it works
      const attempts = 3;

      for (let i = 0; i < attempts; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          });

        // First attempts should fail with auth error, not rate limit error
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).not.toBe('RATE_LIMITED');
      }
    });

    it('rejects login requests after exceeding rate limit', async () => {
      // This test is environment-dependent
      // In production: 5 attempts per 15 minutes
      // In test/dev: 100 attempts per 15 minutes
      // We'll make a reasonable number of attempts to verify the mechanism works
      
      const maxAttempts = 105; // Slightly above test limit of 100
      let rateLimitedCount = 0;

      for (let i = 0; i < maxAttempts; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: `test${i}@example.com`,
            password: 'wrongpassword',
          });

        if (res.body.error?.code === 'RATE_LIMITED') {
          rateLimitedCount++;
        }
      }

      // In test environment with 100 limit, we should get rate limited after 100 attempts
      // In production with 5 limit, we would get rate limited after 5 attempts
      // Verify that rate limiting eventually kicks in
      expect(rateLimitedCount).toBeGreaterThan(0);
      
      // Verify the last response has the rate limit error
      const finalRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'final@example.com',
          password: 'wrongpassword',
        });

      expect(finalRes.status).toBe(429);
      expect(finalRes.body.success).toBe(false);
      expect(finalRes.body.error.code).toBe('RATE_LIMITED');
      expect(finalRes.body.error.message).toBe('Too many authentication attempts');
    });

    it('rejects register requests after exceeding rate limit', async () => {
      const maxAttempts = 105;
      let rateLimitedCount = 0;

      for (let i = 0; i < maxAttempts; i++) {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test${i}@example.com`,
            username: `testuser${i}`,
            password: 'password123',
          });

        if (res.body.error?.code === 'RATE_LIMITED') {
          rateLimitedCount++;
        }
      }

      expect(rateLimitedCount).toBeGreaterThan(0);

      const finalRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'final@example.com',
          username: 'finaluser',
          password: 'password123',
        });

      expect(finalRes.status).toBe(429);
      expect(finalRes.body.success).toBe(false);
      expect(finalRes.body.error.code).toBe('RATE_LIMITED');
      expect(finalRes.body.error.message).toBe('Too many authentication attempts');
    });

    it('does not rate limit refresh token endpoint', async () => {
      // Refresh endpoint does not have rate limiter
      const attempts = 105;
      let rateLimitedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const res = await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: 'invalid' });

        if (res.body.error?.code === 'RATE_LIMITED') {
          rateLimitedCount++;
        }
      }

      // Should not be rate limited
      expect(rateLimitedCount).toBe(0);
    });

    it('does not rate limit non-auth endpoints', async () => {
      // Other endpoints like stats, posts, etc should not be rate limited
      const attempts = 105;
      let rateLimitedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const res = await request(app)
          .get('/api/v1/posts');

        if (res.body.error?.code === 'RATE_LIMITED') {
          rateLimitedCount++;
        }
      }

      // Should not be rate limited
      expect(rateLimitedCount).toBe(0);
    });
  });

  describe('Rate limit response headers', () => {
    it('includes rate limit headers in response', async () => {
      // Make enough requests to trigger rate limit
      const maxAttempts = 105;

      for (let i = 0; i < maxAttempts; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: `test${i}@example.com`,
            password: 'wrongpassword',
          });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'final@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(429);
      // Check for standard rate limit headers
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
      expect(res.headers['retry-after']).toBeDefined();
    });
  });
});

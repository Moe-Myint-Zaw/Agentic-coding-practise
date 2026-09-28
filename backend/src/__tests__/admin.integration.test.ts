import request from 'supertest';
import app from '../app';
import { server } from '../app';
import prisma from '../config/database';

interface AdminUser {
  id: string;
  username: string;
  email: string;
}

interface AdminPost {
  id: string;
  authorId: string;
  content: string;
}

interface AdminComment {
  id: string;
  authorId: string;
  post: {
    id: string;
    content: string;
  };
  author: {
    id: string;
    username: string;
  };
}

describe('Admin integration', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await new Promise<void>((resolve) => server.listen(0, resolve));

    // Create admin user
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        username: 'admin',
        password: 'password123',
      });
    adminId = adminRes.body.data.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
    
    // Re-login to get admin token
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });
    adminToken = adminLoginRes.body.data.tokens.accessToken;

    // Create regular user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        username: 'regularuser',
        password: 'password123',
      });
    userId = userRes.body.data.user.id;
    userToken = userRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  });

  describe('Admin stats endpoint', () => {
    it('returns admin stats for admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.data.activeUsers).toBeGreaterThanOrEqual(2);
      expect(typeof res.body.data.totalPosts).toBe('number');
      expect(typeof res.body.data.totalComments).toBe('number');
    });

    it('rejects admin stats for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects admin stats without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Admin user listing', () => {
    it('lists all users with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('searches users by username', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.some((u: AdminUser) => u.username === 'admin')).toBe(true);
    });

    it('searches users by email', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=user@example.com')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.some((u: AdminUser) => u.email === 'user@example.com')).toBe(true);
    });

    it('rejects user listing for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Admin post listing', () => {
    beforeAll(async () => {
      // Create some test posts
      await prisma.post.create({
        data: { authorId: userId, content: 'Test post 1' },
      });
      await prisma.post.create({
        data: { authorId: adminId, content: 'Test post 2' },
      });
    });

    it('lists all posts with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/posts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('filters posts by user ID', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/posts?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.every((p: AdminPost) => p.authorId === userId)).toBe(true);
    });

    it('rejects post listing for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/posts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Admin comment listing', () => {
    beforeAll(async () => {
      // Create a test post and comments
      const post = await prisma.post.create({
        data: { authorId: userId, content: 'Comment test post' },
      });
      await prisma.comment.create({
        data: { authorId: userId, postId: post.id, content: 'Test comment 1' },
      });
      await prisma.comment.create({
        data: { authorId: adminId, postId: post.id, content: 'Test comment 2' },
      });
    });

    it('lists all comments with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('filters comments by user ID', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/comments?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.every((c: AdminComment) => c.authorId === userId)).toBe(true);
    });

    it('includes post details in comment listing', async () => {
      const res = await request(app)
        .get('/api/v1/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].post).toBeDefined();
      expect(res.body.data.items[0].author).toBeDefined();
    });

    it('rejects comment listing for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/comments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

});

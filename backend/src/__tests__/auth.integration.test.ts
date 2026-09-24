import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('Auth integration', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a user through the versioned API', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
  });

  it('logs the same user in', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('testuser');
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('refreshes an access token with a valid refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginRes.body.data.tokens.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.tokens.accessToken).toBeTruthy();
    expect(refreshRes.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('allows the Vite frontend dev origin through CORS', async () => {
    const res = await request(app)
      .options('/api/v1/posts')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('allows public profile lookup without authentication', async () => {
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `public-${Date.now()}@example.com`,
        username: `public${Date.now()}`,
        password: 'password123',
      });

    const profileUrl = `/api/v1/users/${userRes.body.data.user.id}`;
    const profileRes = await request(app).get(profileUrl);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.id).toBe(userRes.body.data.user.id);
  });

  it('allows users to follow and unfollow another user', async () => {
    const target = await prisma.user.findFirst({ where: { username: { not: 'testuser' } } });
    expect(target).toBeTruthy();
    const source = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    const token = source.body.data.tokens.accessToken;
    const targetId = target!.id;

    const followRes = await request(app)
      .post(`/api/v1/users/${targetId}/follow`)
      .set('Authorization', `Bearer ${token}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body.data.following).toBe(true);

    const profileRes = await request(app)
      .get(`/api/v1/users/${targetId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(profileRes.body.data.isFollowing).toBe(true);
    expect(profileRes.body.data.followerCount).toBe(1);

    const unfollowRes = await request(app)
      .delete(`/api/v1/users/${targetId}/follow`)
      .set('Authorization', `Bearer ${token}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.data.following).toBe(false);
  });
});

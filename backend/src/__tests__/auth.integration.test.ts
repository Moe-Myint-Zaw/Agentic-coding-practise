import request from 'supertest';
import WebSocket from 'ws';
import type { AddressInfo } from 'net';
import app from '../app';
import { server } from '../app';
import prisma from '../config/database';

describe('Auth integration', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
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

  it('lets any authenticated user search public profiles by username or display name', async () => {
    const targetRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `search-${Date.now()}@example.com`,
        username: `s${Date.now()}`,
        password: 'password123',
      });
    const targetId = targetRes.body.data.user.id;

    await prisma.user.update({ where: { id: targetId }, data: { displayName: 'Searchable Person' } });

    const token = (await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })).body.data.tokens.accessToken;
    const searchRes = await request(app)
      .get('/api/v1/users/search?q=searchable')
      .set('Authorization', `Bearer ${token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: targetId, displayName: 'Searchable Person' }),
    ]));
    expect(searchRes.body.data.items[0].email).toBeUndefined();
  });

  it('rejects search queries shorter than two characters', async () => {
    const token = (await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })).body.data.tokens.accessToken;
    const response = await request(app)
      .get('/api/v1/users/search?q=a')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SEARCH_QUERY');
  });

  it('delivers authenticated follow notifications over WebSocket and exposes read history', async () => {
    const targetRes = await request(app).post('/api/v1/auth/register').send({
      email: `notification-target-${Date.now()}@example.com`,
      username: `nt${Date.now().toString().slice(-8)}`,
      password: 'password123',
    });
    const actorRes = await request(app).post('/api/v1/auth/register').send({
      email: `notification-actor-${Date.now()}@example.com`,
      username: `na${Date.now().toString().slice(-8)}`,
      password: 'password123',
    });
    const targetToken = targetRes.body.data.tokens.accessToken;
    const actorToken = actorRes.body.data.tokens.accessToken;
    const targetId = targetRes.body.data.user.id;
    const port = (server.address() as AddressInfo).port;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${targetToken}`);

    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve());
      socket.once('error', reject);
    });
    const eventPromise = new Promise<{ data: { type: string; actor: { username: string } } }>((resolve, reject) => {
      socket.on('message', (message) => {
        const event = JSON.parse(message.toString());
        if (event.type === 'notification.created') resolve(event);
      });
      socket.once('error', reject);
    });

    const followRes = await request(app)
      .post(`/api/v1/users/${targetId}/follow`)
      .set('Authorization', `Bearer ${actorToken}`);
    expect(followRes.status).toBe(200);

    const event = await eventPromise;
    expect(event.data.type).toBe('FOLLOWED');
    expect(event.data.actor.username).toBe(actorRes.body.data.user.username);

    const historyRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${targetToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.unreadCount).toBe(1);
    const notificationId = historyRes.body.data.items[0].id;

    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${targetToken}`);
    expect(readRes.body.data.updated).toBe(true);
    socket.close();
  });
});

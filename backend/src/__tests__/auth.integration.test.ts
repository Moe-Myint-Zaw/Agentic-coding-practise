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

  it('searches public post text and profiles while excluding deleted posts and private fields', async () => {
    const targetRes = await request(app).post('/api/v1/auth/register').send({
      email: `fulltext-${Date.now()}@example.com`,
      username: `ft${Date.now().toString().slice(-8)}`,
      password: 'password123',
    });
    const targetId = targetRes.body.data.user.id;
    await prisma.user.update({ where: { id: targetId }, data: { displayName: 'Cedar Archive' } });
    const visiblePost = await prisma.post.create({
      data: { authorId: targetId, content: 'A field guide to cedar forests' },
    });
    await prisma.post.create({
      data: { authorId: targetId, content: 'A deleted cedar field note', isDeleted: true },
    });
    await prisma.comment.create({
      data: { authorId: targetId, postId: visiblePost.id, content: 'Cedar needles smell wonderful' },
    });
    await prisma.comment.create({
      data: { authorId: targetId, postId: visiblePost.id, content: 'A deleted cedar reply', isDeleted: true },
    });
    const token = (await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })).body.data.tokens.accessToken;

    const response = await request(app)
      .get('/api/v1/search?q=cedar')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.posts.items).toEqual([
      expect.objectContaining({ id: visiblePost.id, content: 'A field guide to cedar forests' }),
    ]);
    expect(response.body.data.comments.items).toEqual([
      expect.objectContaining({ content: 'Cedar needles smell wonderful' }),
    ]);
    expect(response.body.data.users.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: targetId, displayName: 'Cedar Archive' }),
    ]));
    expect(response.body.data.users.items[0].email).toBeUndefined();
    expect(response.body.data.posts.items[0].author.email).toBeUndefined();
    expect(response.body.data.comments.items[0].author.email).toBeUndefined();

    const nextPostsPage = await request(app)
      .get('/api/v1/search?q=cedar&page=1&postsPage=2&commentsPage=2')
      .set('Authorization', `Bearer ${token}`);
    expect(nextPostsPage.body.data.users.pagination.page).toBe(1);
    expect(nextPostsPage.body.data.posts.pagination.page).toBe(2);
    expect(nextPostsPage.body.data.posts.items).toHaveLength(0);
    expect(nextPostsPage.body.data.comments.pagination.page).toBe(2);
    expect(nextPostsPage.body.data.comments.items).toHaveLength(0);
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

  it('broadcasts post, comment, and like updates to every connected user', async () => {
    const actorRes = await request(app).post('/api/v1/auth/register').send({
      email: `content-actor-${Date.now()}@example.com`,
      username: `ca${Date.now().toString().slice(-8)}`,
      password: 'password123',
    });
    const observerRes = await request(app).post('/api/v1/auth/register').send({
      email: `content-observer-${Date.now()}@example.com`,
      username: `co${Date.now().toString().slice(-8)}`,
      password: 'password123',
    });
    const port = (server.address() as AddressInfo).port;
    const sockets = [actorRes, observerRes].map((response) =>
      new WebSocket(`ws://127.0.0.1:${port}/ws?token=${response.body.data.tokens.accessToken}`),
    );
    await Promise.all(sockets.map((socket) => new Promise<void>((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    })));

    const nextContentEvent = (socket: WebSocket) => new Promise<{ data: { resource: string; action: string; postId: string } }>((resolve) => {
      const onMessage = (message: WebSocket.RawData) => {
        const event = JSON.parse(message.toString());
        if (event.type !== 'content.updated') return;
        socket.off('message', onMessage);
        resolve(event);
      };
      socket.on('message', onMessage);
    });
    const expectBroadcast = async (action: () => Promise<request.Response>, resource: string, expectedAction: string) => {
      const events = sockets.map(nextContentEvent);
      const response = await action();
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
      const received = await Promise.all(events);
      for (const event of received) {
        expect(event.data.resource).toBe(resource);
        expect(event.data.action).toBe(expectedAction);
      }
      return response;
    };

    try {
      const postRes = await expectBroadcast(
        () => request(app).post('/api/v1/posts').set('Authorization', `Bearer ${actorRes.body.data.tokens.accessToken}`).send({ content: 'Realtime post' }),
        'post',
        'created',
      );
      const postId = postRes.body.data.id;
      const commentRes = await expectBroadcast(
        () => request(app).post('/api/v1/comments').set('Authorization', `Bearer ${observerRes.body.data.tokens.accessToken}`).send({ postId, content: 'Realtime comment' }),
        'comment',
        'created',
      );
      const commentId = commentRes.body.data.id;
      await expectBroadcast(
        () => request(app).post(`/api/v1/likes/post/${postId}`).set('Authorization', `Bearer ${observerRes.body.data.tokens.accessToken}`),
        'post-like',
        'liked',
      );
      await expectBroadcast(
        () => request(app).post(`/api/v1/likes/post/${postId}`).set('Authorization', `Bearer ${observerRes.body.data.tokens.accessToken}`),
        'post-like',
        'unliked',
      );
      await expectBroadcast(
        () => request(app).post(`/api/v1/likes/comment/${commentId}`).set('Authorization', `Bearer ${actorRes.body.data.tokens.accessToken}`),
        'comment-like',
        'liked',
      );
      await expectBroadcast(
        () => request(app).post(`/api/v1/likes/comment/${commentId}`).set('Authorization', `Bearer ${actorRes.body.data.tokens.accessToken}`),
        'comment-like',
        'unliked',
      );
    } finally {
      sockets.forEach((socket) => socket.close());
    }
  });
});

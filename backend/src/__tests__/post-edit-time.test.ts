import request from 'supertest';
import app from '../app';
import { server } from '../app';
import prisma from '../config/database';

describe('Post editing time restriction', () => {
  let userToken: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.post.deleteMany();
    await new Promise<void>((resolve) => server.listen(0, resolve));

    // Create user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });
    userId = userRes.body.data.user.id;
    userToken = userRes.body.data.tokens.accessToken;

    // Create a post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Original post content' });
    postId = postRes.body.data.id;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  });

  it('allows editing within 24 hours', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Updated post content' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Updated post content');
  });

  it('rejects editing after 24 hours with POST_EDIT_EXPIRED', async () => {
    // Create a post with a timestamp older than 24 hours
    const oldPost = await prisma.post.create({
      data: {
        authorId: userId,
        content: 'Old post content',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      },
    });

    const res = await request(app)
      .put(`/api/v1/posts/${oldPost.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Should not be updated' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_EDIT_EXPIRED');
    expect(res.body.error.message).toBe('Posts can only be edited within 24 hours');

    // Clean up
    await prisma.post.delete({ where: { id: oldPost.id } });
  });

  it('validates post content during edit', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_CONTENT_REQUIRED');
  });

  it('allows updating images during edit', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ 
        content: 'Post with images',
        images: ['image1.jpg', 'image2.jpg']
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toEqual(['image1.jpg', 'image2.jpg']);
  });

  it('rejects editing another user\'s post', async () => {
    // Create another user
    const otherUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123',
      });
    const otherToken = otherUserRes.body.data.tokens.accessToken;

    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Unauthorized edit' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows partial update (content only)', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Partial content update' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Partial content update');
  });

  it('allows partial update (images only)', async () => {
    const res = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ images: ['new-image.jpg'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toEqual(['new-image.jpg']);
  });

  it('rejects editing non-existent post', async () => {
    const res = await request(app)
      .put('/api/v1/posts/non-existent-id')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Should not work' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('POST_NOT_FOUND');
  });
});

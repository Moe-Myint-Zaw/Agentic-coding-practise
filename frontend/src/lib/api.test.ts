import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('api.getUser', () => {
  it('unwraps the backend response envelope', async () => {
    const user = {
      id: 'target-user',
      username: 'targetuser',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: user }),
    }));

    await expect(api.getUser(user.id)).resolves.toEqual(user);
  });
});

describe('api.getNotifications', () => {
  it('unwraps the backend response envelope', async () => {
    const notifications = {
      items: [],
      unreadCount: 0,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: notifications }),
    }));

    await expect(api.getNotifications()).resolves.toEqual(notifications);
  });
});

describe('api.search', () => {
  it('unwraps the backend response envelope', async () => {
    const results = {
      query: 'hello',
      users: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      posts: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      comments: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: results }),
    }));

    await expect(api.search('hello')).resolves.toEqual(results);
  });
});

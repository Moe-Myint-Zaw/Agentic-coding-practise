import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Profile } from './Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../lib/api');
vi.mock('../contexts/AuthContext');

describe('Profile', () => {
  let queryClient: QueryClient;
  const mockedApi = vi.mocked(api);
  const mockedUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        isBanned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockedApi.getUserPosts.mockResolvedValue({
      data: {
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/profile/test-user']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/profile/:id" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );

  it('shows loading state while fetching user', () => {
    mockedApi.getUser.mockImplementation(() => new Promise(() => {}));

    render(<Profile />, { wrapper });

    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('follows the profile user by their returned id', async () => {
    const profileUser = {
      id: 'target-user',
      email: 'target@example.com',
      username: 'targetuser',
      role: 'USER' as const,
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFollowing: false,
    };
    mockedApi.getUser.mockResolvedValue(profileUser);
    mockedApi.followUser.mockResolvedValue({ following: true, userId: profileUser.id });

    render(<Profile />, { wrapper });

    fireEvent.click(await screen.findByRole('button', { name: /follow/i }));

    await waitFor(() => expect(mockedApi.followUser).toHaveBeenCalledWith('target-user'));
  });

  it('shows the searched user photos instead of the logged-in user photos', async () => {
    const auth = mockedUseAuth();
    mockedUseAuth.mockReturnValue({
      ...auth,
      user: {
        ...auth.user!,
        profileImage: '/uploads/current-profile.jpg',
        coverImage: '/uploads/current-cover.jpg',
      },
    });
    vi.mocked(resolveMediaUrl).mockImplementation((url) => url);
    mockedApi.getUser.mockResolvedValue({
      id: 'target-user',
      email: 'target@example.com',
      username: 'targetuser',
      displayName: 'Target User',
      profileImage: '/uploads/target-profile.jpg',
      coverImage: '/uploads/target-cover.jpg',
      role: 'USER',
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<Profile />, { wrapper });

    await screen.findByAltText('Target User');
    expect(screen.getByAltText('Target User').getAttribute('src')).toBe('/uploads/target-profile.jpg');
    expect(document.querySelector('img[alt=""]')?.getAttribute('src')).toBe('/uploads/target-cover.jpg');
  });
});

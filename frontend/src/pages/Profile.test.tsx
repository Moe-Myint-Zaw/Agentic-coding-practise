import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Profile } from './Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../lib/api';
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
});

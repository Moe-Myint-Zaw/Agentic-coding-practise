import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Admin } from './Admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../lib/api');
vi.mock('../contexts/AuthContext');

describe('Admin', () => {
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
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );

  it('renders admin dashboard for admin users', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
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

    mockedApi.getAdminStats.mockResolvedValue({
      data: { totalUsers: 100, totalPosts: 50, totalComments: 25, activeUsers: 10 },
    });
    mockedApi.getAdminUsers.mockResolvedValue({
      data: { items: [], pagination: { total: 0, page: 1, totalPages: 1 } },
    });

    render(<Admin />, { wrapper });

    expect(screen.getByText(/dashboard/i)).toBeTruthy();
  });
});

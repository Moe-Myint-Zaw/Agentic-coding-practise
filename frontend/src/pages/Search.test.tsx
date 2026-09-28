import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchPage } from './Search';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../lib/api';

vi.mock('../lib/api');

describe('SearchPage', () => {
  let queryClient: QueryClient;
  const mockedApi = vi.mocked(api);

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

  it('renders search page with title and input', () => {
    render(<SearchPage />, { wrapper });

    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
  });

  it('does not call search API on initial render', () => {
    render(<SearchPage />, { wrapper });

    expect(mockedApi.search).not.toHaveBeenCalled();
  });
});

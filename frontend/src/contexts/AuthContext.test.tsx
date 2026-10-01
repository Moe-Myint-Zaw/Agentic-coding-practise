import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'removeItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth', () => {
    it('provides auth context values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('tokens');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
    });

    it('loads tokens from localStorage on mount', async () => {
      const mockTokens = { accessToken: 'test-token', refreshToken: 'refresh-token' };
      const mockUser = { id: '1', username: 'testuser', displayName: 'Test User' };
      localStorage.setItem('authTokens', JSON.stringify(mockTokens));
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('is not authenticated when no tokens in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.tokens).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles login successfully', async () => {
      const mockResponse = {
        data: {
          tokens: { accessToken: 'new-token', refreshToken: 'new-refresh' },
          user: { id: '1', username: 'testuser', displayName: 'Test User' },
        },
      };

      // @ts-ignore - Mocking fetch for testing
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.tokens).toEqual(mockResponse.data.tokens);
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('authTokens', JSON.stringify(mockResponse.data.tokens));
      expect(localStorage.setItem).toHaveBeenCalledWith('authUser', JSON.stringify(mockResponse.data.user));
    });

    it('handles login errors', async () => {
      const mockError = { error: { message: 'Invalid credentials' } };
      // @ts-ignore - Mocking fetch for testing
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockError,
      } as Response);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(result.current.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });

    it('handles register successfully', async () => {
      const mockResponse = {
        data: {
          tokens: { accessToken: 'new-token', refreshToken: 'new-refresh' },
          user: { id: '1', username: 'newuser', displayName: 'New User' },
        },
      };

      // @ts-ignore - Mocking fetch for testing
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({ email: 'new@example.com', username: 'newuser', password: 'password', confirmPassword: 'password', displayName: 'New User' });
      });

      expect(result.current.tokens).toEqual(mockResponse.data.tokens);
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('authTokens', JSON.stringify(mockResponse.data.tokens));
      expect(localStorage.setItem).toHaveBeenCalledWith('authUser', JSON.stringify(mockResponse.data.user));
    });

    it('handles register errors', async () => {
      const mockError = { error: { message: 'Username already exists' } };
      // @ts-ignore - Mocking fetch for testing
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => mockError,
      } as Response);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(result.current.register({ email: 'existing@example.com', username: 'existing', password: 'password', confirmPassword: 'password', displayName: 'Test' })).rejects.toThrow('Username already exists');
    });

    it('handles logout', async () => {
      const mockTokens = { accessToken: 'test-token', refreshToken: 'refresh-token' };
      const mockUser = { id: '1', username: 'testuser', displayName: 'Test User' };
      localStorage.setItem('authTokens', JSON.stringify(mockTokens));
      localStorage.setItem('authUser', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.logout();
      });

      expect(result.current.tokens).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('authTokens');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authUser');
    });

    it('uses default API URL when env var not set', async () => {
      const mockResponse = {
        data: {
          tokens: { accessToken: 'token', refreshToken: 'refresh' },
          user: { id: '1', username: 'test', displayName: 'Test' },
        },
      };

      // @ts-ignore - Mocking fetch for testing
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://yaycha-api-production-51d9.up.railway.app/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });
});

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { clearSessionQueries } from '@/lib/query-client';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(async (error) => {
        if (error instanceof ApiError && error.status === 401) {
          await authStorage.clear();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (result: Awaited<ReturnType<typeof api.login>>) => {
    await authStorage.save(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: async (email, password) => authenticate(await api.login({ email, password })),
        register: async (email, username, password) => authenticate(await api.register({ email, username, password })),
        logout: async () => {
          await clearSessionQueries();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
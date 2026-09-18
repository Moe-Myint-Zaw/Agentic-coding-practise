import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthTokens, LoginCredentials, RegisterCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('authTokens');
    const storedUser = localStorage.getItem('authUser');
    if (storedTokens && storedUser) {
      setTokens(JSON.parse(storedTokens));
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    setTokens(data.data.tokens);
    setUser(data.data.user);
    localStorage.setItem('authTokens', JSON.stringify(data.data.tokens));
    localStorage.setItem('authUser', JSON.stringify(data.data.user));
  };

  const register = async (credentials: RegisterCredentials) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data = await response.json();
    setTokens(data.data.tokens);
    setUser(data.data.user);
    localStorage.setItem('authTokens', JSON.stringify(data.data.tokens));
    localStorage.setItem('authUser', JSON.stringify(data.data.user));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('authUser');
  };

  const isAuthenticated = !!tokens;

  return (
    <AuthContext.Provider value={{ user, tokens, login, register, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
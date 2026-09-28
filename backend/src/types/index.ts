import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

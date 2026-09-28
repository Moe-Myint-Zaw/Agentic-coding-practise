import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import type { JWTPayload } from '../types';

const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
};

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_SECRET as Secret, accessTokenOptions);
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, refreshTokenOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
};

export const generateTokens = (user: { id: string; email: string; username: string; role: 'USER' | 'ADMIN' }) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  return { accessToken, refreshToken };
};

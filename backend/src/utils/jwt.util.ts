import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import env from '../config/env';

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

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
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

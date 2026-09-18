import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { ApiError } from '../middleware/error.middleware';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        { username: input.username },
      ],
    },
  });

  if (existing) {
    throw new ApiError('User already exists', 409, 'USER_EXISTS');
  }

  const password = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      password,
      displayName: input.username,
      role: 'USER',
      isBanned: false,
    },
  });

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    tokens,
  };
};

export const loginUser = async (input: { email: string; password: string }) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.email }] },
  });

  if (!user || !(await comparePassword(input.password, user.password))) {
    throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.isBanned) {
    throw new ApiError('Account is banned', 403, 'USER_BANNED');
  }

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      profileImage: user.profileImage,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    tokens,
  };
};

export const refreshUserTokens = async (refreshToken: unknown) => {
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw new ApiError('Refresh token is required', 401, 'NO_REFRESH_TOKEN');
  }

  try {
    const payload = verifyRefreshToken(refreshToken) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.isBanned) {
      throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return { tokens: generateTokens({ id: user.id, email: user.email, username: user.username, role: user.role === 'ADMIN' ? 'ADMIN' : 'USER' }) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
};

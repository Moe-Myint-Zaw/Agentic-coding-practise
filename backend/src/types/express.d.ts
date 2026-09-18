declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

export {};

import env from './env';

export const getPublicCorsOptions = () => {
  const allowedOrigins = env.CORS_ORIGIN === '*' ? ['*'] : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  return {
    origin: (requestOrigin: string | undefined, callback: (error: Error | null, allowed?: boolean | string) => void) => {
      if (!requestOrigin || allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
};

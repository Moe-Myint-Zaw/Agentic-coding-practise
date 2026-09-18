import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import env from './config/env';
import { getPublicCorsOptions } from './config/cors';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors(getPublicCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1', apiRoutes);
app.use(errorMiddleware);

const port = Number(env.PORT || 3000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Yaycha backend running on http://0.0.0.0:${port}`);
  });
}

export default app;

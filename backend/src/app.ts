import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './utils/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { matchesRouter } from './routes/matches';
import { statsRouter } from './routes/stats';
import { adminRouter } from './routes/admin';

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);



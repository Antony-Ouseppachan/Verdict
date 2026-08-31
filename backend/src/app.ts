import express, { type Express } from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';
import { statusRouter } from './routes/status.js';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    })
  );

  app.use(express.json());

  // Mount API endpoints
  app.use(analyzeRouter);
  app.use(statusRouter);

  // Fallback for root
  app.get('/', (_req, res) => {
    res.json({
      name: 'Verdict Intelligence Backend',
      status: 'online',
    });
  });

  return app;
}

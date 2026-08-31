import { Router, type Request, type Response } from 'express';

export const statusRouter = Router();

statusRouter.get('/v1/status', (_req: Request, res: Response) => {
  res.json({
    operational: true,
    service: 'verdict-intelligence-engine',
    version: '0.1.0',
    timestamp: Date.now(),
  });
});

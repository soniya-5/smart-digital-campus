import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'CONNECTED',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      database: 'DISCONNECTED',
      error: 'Database connection failed',
    });
  }
});

export default router;

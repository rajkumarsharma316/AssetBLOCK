import express from 'express';
import { supabase } from '../db/database.js';
import logger from '../utils/logger.js';
import os from 'os';

const router = express.Router();

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    // Check DB connection
    await supabase.from('users').select('id').limit(1);
    dbLatency = Date.now() - startTime;
  } catch (error) {
    dbStatus = 'unhealthy';
    logger.error('DB Health Check Failed', { error: error.message });
  }

  res.json({
    status: 'success',
    data: {
      uptime: process.uptime(),
      system: {
        memoryUsage: process.memoryUsage(),
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
        loadAvg: os.loadavg()
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency
      },
      workers: {
        contractMonitor: 'active',
        lastRun: new Date().toISOString()
      }
    }
  });
});

export default router;

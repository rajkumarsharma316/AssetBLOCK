import express from 'express';
import cors from 'cors';
import config from './config.js';
import authRoutes from './routes/auth.js';
import contractRoutes from './routes/contracts.js';
import transactionRoutes from './routes/transactions.js';
import feedbackRoutes from './routes/feedback.js';
import metricsRoutes from './routes/metrics.js';
import monitoringRoutes from './routes/monitoring.js';
import indexingRoutes from './routes/indexing.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startMonitor } from './services/monitor.js';
import logger from './utils/logger.js';

const app = express();

// Middleware
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow any origin for the MVP (including Vercel deployments and localhost)
    callback(null, true);
  }, 
  credentials: true 
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/monitor', monitoringRoutes);
app.use('/api/indexing', indexingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.server.port, () => {
  logger.info(`CPE Backend running on http://localhost:${config.server.port}`);

  // Start background condition monitor
  startMonitor();
});

export default app;

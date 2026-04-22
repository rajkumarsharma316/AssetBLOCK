import express from 'express';
import cors from 'cors';
import config from './config.js';
import { getDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import contractRoutes from './routes/contracts.js';
import transactionRoutes from './routes/transactions.js';
import feedbackRoutes from './routes/feedback.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startMonitor } from './services/monitor.js';
import logger from './utils/logger.js';

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Initialize database
getDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/feedback', feedbackRoutes);

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

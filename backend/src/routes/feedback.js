import express from 'express';
import { insert, findAll } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';
import config from '../config.js';

const router = express.Router();

/**
 * POST /api/feedback
 * Accepts feedback data and inserts it into the database
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, walletAddress, rating, description } = req.body;

    // Validation
    if (!name || !email || !walletAddress || !rating || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const feedbackEntry = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim(),
      wallet_address: walletAddress.trim(),
      rating,
      description: description.trim(),
    };

    await insert('feedback', feedbackEntry);

    logger.info(`New feedback from ${name} (${email}) - Rating: ${rating}/5`);

    res.json({
      message: 'Feedback submitted successfully!',
      feedbackId: feedbackEntry.id,
    });
  } catch (err) {
    logger.error('Error saving feedback:', { error: err.message });
    res.status(500).json({ error: 'Failed to save feedback. Please try again.' });
  }
});

/**
 * GET /api/feedback
 * Returns all feedback entries (Admin only)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.publicKey !== config.admin.wallet) {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const data = await findAll('feedback', {}, { orderBy: 'created_at', ascending: false });
    res.json({ feedback: data, total: data.length });
  } catch (err) {
    logger.error('Error reading feedback:', { error: err.message });
    res.status(500).json({ error: 'Failed to read feedback data.' });
  }
});

/**
 * GET /api/feedback/export
 * Downloads all feedback as a CSV file (Admin only)
 */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    if (req.user.publicKey !== config.admin.wallet) {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    const data = await findAll('feedback', {}, { orderBy: 'created_at', ascending: false });
    
    // Convert JSON to CSV
    if (data.length === 0) {
      return res.send('No feedback available.');
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row)
        .map(val => {
          // Escape quotes and wrap in quotes if there are commas or newlines
          const str = String(val);
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback_export.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    logger.error('Error exporting feedback:', { error: err.message });
    res.status(500).json({ error: 'Failed to export feedback data.' });
  }
});

export default router;

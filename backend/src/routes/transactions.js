import { Router } from 'express';
import { rpc } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/transactions
 * Get all transactions for the authenticated user's contracts.
 */
router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use RPC function for the complex JOIN query
    const transactions = await rpc('get_user_transactions', {
      user_key: req.user.publicKey,
      type_filter: type || null,
      lim: parseInt(limit),
      off: offset,
    });

    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions: ' + err.message });
  }
});

/**
 * GET /api/transactions/contract/:contractId
 * Get transactions for a specific contract.
 */
router.get('/contract/:contractId', async (req, res) => {
  try {
    const { findAll } = await import('../db/database.js');
    const transactions = await findAll('transactions', { contract_id: req.params.contractId }, {
      orderBy: 'created_at',
      ascending: false,
    });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions: ' + err.message });
  }
});

export default router;

import { Router } from 'express';
import { findAll } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/transactions
 * Get all transactions for the authenticated user's contracts.
 */
router.get('/', (req, res) => {
  const { type, page = 1, limit = 30 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT t.*, c.title as contract_title, c.creator_public_key, c.destination
    FROM transactions t
    JOIN contracts c ON c.id = t.contract_id
    LEFT JOIN signers s ON s.contract_id = c.id
    WHERE (c.creator_public_key = ? OR s.public_key = ? OR c.destination = ?)
  `;
  const params = [req.user.publicKey, req.user.publicKey, req.user.publicKey];

  if (type) {
    sql += ' AND t.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const transactions = findAll(sql, params);
  res.json({ transactions });
});

/**
 * GET /api/transactions/contract/:contractId
 * Get transactions for a specific contract.
 */
router.get('/contract/:contractId', (req, res) => {
  const transactions = findAll(
    'SELECT * FROM transactions WHERE contract_id = ? ORDER BY created_at DESC',
    [req.params.contractId]
  );
  res.json({ transactions });
});

export default router;

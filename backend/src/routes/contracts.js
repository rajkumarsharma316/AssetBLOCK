import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findOne, findAll, run, insert } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { createEscrow, buildFundTransaction, markFunded, releaseEscrow, refundEscrow } from '../services/escrow.js';
import { createNotification } from '../services/notifications.js';
import { findPaths, buildPathPaymentTx } from '../services/pathPayment.js';
import logger from '../utils/logger.js';

const router = Router();

// All contract routes require authentication
router.use(authMiddleware);

/**
 * POST /api/contracts
 * Create a new payment contract with conditions and signers.
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      assetCode = 'XLM',
      assetIssuer,
      destination,
      destAssetCode,
      destAssetIssuer,
      conditions = [],
      signers = [],
      threshold = 2,
    } = req.body;

    // Validation
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!destination) return res.status(400).json({ error: 'Destination is required' });

    const contractId = uuidv4();

    // Create the contract record
    insert('contracts', {
      id: contractId,
      creator_public_key: req.user.publicKey,
      title,
      description: description || '',
      amount: String(amount),
      asset_code: assetCode,
      asset_issuer: assetIssuer || null,
      destination,
      dest_asset_code: destAssetCode || null,
      dest_asset_issuer: destAssetIssuer || null,
      status: 'pending',
    });

    // Add conditions
    for (const cond of conditions) {
      insert('conditions', {
        id: uuidv4(),
        contract_id: contractId,
        type: cond.type,
        logic_operator: cond.logicOperator || 'AND',
        logic_group: cond.logicGroup || 0,
        params: JSON.stringify(cond.params),
        is_met: 0,
      });
    }

    // Add signers (ensure creator is automatically included as a signer)
    const submittedSigners = signers.map(s => s.publicKey || s);
    const allSignerKeys = [...new Set([req.user.publicKey, ...submittedSigners])];

    for (const signerKey of allSignerKeys) {
      insert('signers', {
        id: uuidv4(),
        contract_id: contractId,
        public_key: signerKey,
        weight: 1,
        has_signed: 0,
      });
    }

    // Create the escrow account
    const escrowResult = await createEscrow(
      contractId,
      submittedSigners,
      req.user.publicKey,
      threshold
    );

    const contract = findOne('SELECT * FROM contracts WHERE id = ?', [contractId]);
    const contractConditions = findAll('SELECT * FROM conditions WHERE contract_id = ?', [contractId]);
    const contractSigners = findAll('SELECT * FROM signers WHERE contract_id = ?', [contractId]);

    logger.info('Contract created', { contractId, title });

    res.status(201).json({
      contract: {
        ...contract,
        conditions: contractConditions,
        signers: contractSigners,
        escrow: escrowResult,
      },
    });
  } catch (err) {
    logger.error('Failed to create contract', { error: err.message });
    res.status(500).json({ error: 'Failed to create contract: ' + err.message });
  }
});

/**
 * GET /api/contracts
 * List all contracts for the authenticated user.
 */
router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT DISTINCT c.* FROM contracts c
    LEFT JOIN signers s ON s.contract_id = c.id
    WHERE (c.creator_public_key = ? OR s.public_key = ? OR c.destination = ?)
  `;
  const params = [req.user.publicKey, req.user.publicKey, req.user.publicKey];

  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const contracts = findAll(sql, params);

  // Attach conditions and signers to each contract
  const result = contracts.map(contract => {
    const conditions = findAll('SELECT * FROM conditions WHERE contract_id = ?', [contract.id]);
    const signers = findAll('SELECT * FROM signers WHERE contract_id = ?', [contract.id]);
    return { ...contract, conditions, signers };
  });

  res.json({ contracts: result });
});

/**
 * GET /api/contracts/:id
 * Get detailed info for a specific contract.
 */
router.get('/:id', (req, res) => {
  const contract = findOne('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const conditions = findAll('SELECT * FROM conditions WHERE contract_id = ?', [contract.id]);
  const signers = findAll('SELECT * FROM signers WHERE contract_id = ?', [contract.id]);
  const transactions = findAll(
    'SELECT * FROM transactions WHERE contract_id = ? ORDER BY created_at DESC',
    [contract.id]
  );

  res.json({
    contract: { ...contract, conditions, signers, transactions },
  });
});

/**
 * POST /api/contracts/:id/fund
 * Build the fund transaction XDR for client-side signing,
 * or mark as funded after client submission.
 */
router.post('/:id/fund', async (req, res) => {
  try {
    const { txHash } = req.body || {};

    if (txHash) {
      // Client already submitted the transaction — mark as funded
      markFunded(req.params.id, txHash);
      return res.json({ success: true, message: 'Contract funded' });
    }

    // Build the fund transaction XDR
    const xdr = await buildFundTransaction(req.params.id, req.user.publicKey);
    res.json({ xdr });
  } catch (err) {
    logger.error('Fund error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/contracts/:id/approve
 * Manual approval action for approval-based conditions.
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const contract = findOne('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Mark signer as having signed
    run(
      "UPDATE signers SET has_signed = 1, signed_at = datetime('now') WHERE contract_id = ? AND public_key = ?",
      [req.params.id, req.user.publicKey]
    );

    // Update approval conditions
    const approvalConditions = findAll(
      "SELECT * FROM conditions WHERE contract_id = ? AND type = 'approval'",
      [req.params.id]
    );

    for (const cond of approvalConditions) {
      const params = JSON.parse(cond.params);
      const totalApproved = findAll(
        'SELECT * FROM signers WHERE contract_id = ? AND has_signed = 1',
        [req.params.id]
      ).length;

      params.currentApprovals = totalApproved;

      run('UPDATE conditions SET params = ? WHERE id = ?', [JSON.stringify(params), cond.id]);

      if (totalApproved >= (params.requiredApprovals || 1)) {
        run("UPDATE conditions SET is_met = 1, met_at = datetime('now') WHERE id = ?", [cond.id]);
      }
    }

    await createNotification(
      contract.creator_public_key,
      contract.id,
      `Signer ${req.user.publicKey.substring(0, 8)}... approved contract "${contract.title}"`
    );

    logger.info('Contract approved by signer', {
      contractId: req.params.id,
      signer: req.user.publicKey,
    });

    res.json({ success: true, message: 'Approval recorded' });
  } catch (err) {
    logger.error('Approve error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/contracts/:id/cancel
 * Cancel a contract and refund the escrow.
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const contract = findOne('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    if (contract.creator_public_key !== req.user.publicKey) {
      return res.status(403).json({ error: 'Only the creator can cancel' });
    }
    if (contract.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed contract' });
    }

    if (contract.status === 'funded' || contract.status === 'active') {
      // Refund the escrow
      const result = await refundEscrow(req.params.id);
      return res.json({ success: true, message: 'Contract cancelled and refunded', txHash: result.hash });
    }

    // Just mark as cancelled if not yet funded
    run(
      "UPDATE contracts SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: 'Contract cancelled' });
  } catch (err) {
    logger.error('Cancel error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/contracts/:id/status
 * Get real-time condition status for a contract.
 */
router.get('/:id/status', (req, res) => {
  const contract = findOne('SELECT * FROM contracts WHERE id = ?', [req.params.id]);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const conditions = findAll('SELECT * FROM conditions WHERE contract_id = ?', [contract.id]);
  const signers = findAll('SELECT * FROM signers WHERE contract_id = ?', [contract.id]);

  const conditionStatus = conditions.map(c => ({
    id: c.id,
    type: c.type,
    logicOperator: c.logic_operator,
    isMet: !!c.is_met,
    metAt: c.met_at,
    params: JSON.parse(c.params),
  }));

  const signerStatus = signers.map(s => ({
    publicKey: s.public_key,
    hasSigned: !!s.has_signed,
    signedAt: s.signed_at,
  }));

  const allConditionsMet = conditions.every(c => c.is_met);

  res.json({
    contractStatus: contract.status,
    conditions: conditionStatus,
    signers: signerStatus,
    allConditionsMet,
  });
});

/**
 * POST /api/contracts/find-paths
 * Find available path payment routes.
 */
router.post('/find-paths', async (req, res) => {
  try {
    const { destAssetCode, destAssetIssuer, destAmount } = req.body;
    const paths = await findPaths(req.user.publicKey, destAssetCode, destAssetIssuer, destAmount);
    res.json({ paths });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

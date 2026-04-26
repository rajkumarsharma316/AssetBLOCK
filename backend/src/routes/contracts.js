import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findOne, findAll, run, insert, rpc } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { createEscrow, buildFundTransaction, markFunded, releaseEscrow, refundEscrow } from '../services/escrow.js';
import { createNotification } from '../services/notifications.js';
import stellarService from '../services/stellar.js';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import config from '../config.js';
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
    await insert('contracts', {
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
      await insert('conditions', {
        id: uuidv4(),
        contract_id: contractId,
        type: cond.type,
        logic_operator: cond.logicOperator || 'AND',
        logic_group: cond.logicGroup || 0,
        params: JSON.stringify(cond.params),
        is_met: false,
      });
    }

    // Add signers (ensure creator is automatically included as a signer)
    const submittedSigners = signers.map(s => s.publicKey || s);
    const allSignerKeys = [...new Set([req.user.publicKey, ...submittedSigners])];

    for (const signerKey of allSignerKeys) {
      await insert('signers', {
        id: uuidv4(),
        contract_id: contractId,
        public_key: signerKey,
        weight: 1,
        has_signed: false,
      });
    }

    // Create the escrow account
    const escrowResult = await createEscrow(
      contractId,
      submittedSigners,
      req.user.publicKey,
      threshold
    );

    const contract = await findOne('contracts', { id: contractId });
    const contractConditions = await findAll('conditions', { contract_id: contractId });
    const contractSigners = await findAll('signers', { contract_id: contractId });

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
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use RPC function for the complex JOIN query
    const contracts = await rpc('get_user_contracts', {
      user_key: req.user.publicKey,
      status_filter: status || null,
      lim: parseInt(limit),
      off: offset,
    });

    // Attach conditions and signers to each contract
    const result = [];
    for (const contract of contracts) {
      const conditions = await findAll('conditions', { contract_id: contract.id });
      const contractSigners = await findAll('signers', { contract_id: contract.id });
      result.push({ ...contract, conditions, signers: contractSigners });
    }

    res.json({ contracts: result });
  } catch (err) {
    logger.error('Failed to list contracts', { error: err.message });
    res.status(500).json({ error: 'Failed to list contracts: ' + err.message });
  }
});

/**
 * GET /api/contracts/:id
 * Get detailed info for a specific contract.
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = await findOne('contracts', { id: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const conditions = await findAll('conditions', { contract_id: contract.id });
    const contractSigners = await findAll('signers', { contract_id: contract.id });
    const transactions = await findAll('transactions', { contract_id: contract.id }, {
      orderBy: 'created_at',
      ascending: false,
    });

    res.json({
      contract: { ...contract, conditions, signers: contractSigners, transactions },
    });
  } catch (err) {
    logger.error('Failed to get contract', { error: err.message });
    res.status(500).json({ error: 'Failed to get contract: ' + err.message });
  }
});

/**
 * POST /api/contracts/:id/fund
 * Build the fund transaction XDR for client-side signing,
 * or mark as funded after client submission.
 */
router.post('/:id/fund', async (req, res) => {
  try {
    const { txHash, signedXdr } = req.body || {};

    if (txHash) {
      // Client already submitted the transaction — mark as funded
      await markFunded(req.params.id, txHash);
      return res.json({ success: true, message: 'Contract funded' });
    }

    if (signedXdr) {
      // Advanced Feature: Gasless Fee Sponsorship
      // Client has signed the inner transaction, but we will wrap it in a FeeBump
      // and the backend sponsor account will pay the XLM transaction fee.
      const innerTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      
      // Ensure the sponsor account is funded (testnet convenience)
      const sponsorSecret = config.admin.sponsorSecret;
      const { Keypair } = await import('@stellar/stellar-sdk');
      const sponsorPublicKey = Keypair.fromSecret(sponsorSecret).publicKey();
      
      try {
        await stellarService.loadAccount(sponsorPublicKey);
      } catch (e) {
        // If sponsor isn't funded, fund it via friendbot automatically
        await stellarService.fundWithFriendbot(sponsorPublicKey).catch(() => {});
      }

      const feeBumpTx = await stellarService.buildFeeBumpTransaction(innerTx, sponsorSecret);
      const result = await stellarService.submitTransaction(feeBumpTx);
      
      await markFunded(req.params.id, result.hash);
      return res.json({ success: true, message: 'Contract funded gaslessly!', txHash: result.hash });
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
    const contract = await findOne('contracts', { id: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Mark signer as having signed
    await run('signers', 
      { has_signed: true, signed_at: new Date().toISOString() },
      { contract_id: req.params.id, public_key: req.user.publicKey }
    );

    // Update approval conditions
    const approvalConditions = await findAll('conditions', {
      contract_id: req.params.id,
      type: 'approval',
    });

    for (const cond of approvalConditions) {
      const params = JSON.parse(cond.params);
      const allSigners = await findAll('signers', { contract_id: req.params.id, has_signed: true });
      const totalApproved = allSigners.length;

      params.currentApprovals = totalApproved;

      await run('conditions',
        { params: JSON.stringify(params) },
        { id: cond.id }
      );

      if (totalApproved >= (params.requiredApprovals || 1)) {
        await run('conditions',
          { is_met: true, met_at: new Date().toISOString() },
          { id: cond.id }
        );
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
    const contract = await findOne('contracts', { id: req.params.id });
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
    await run('contracts',
      { status: 'cancelled', updated_at: new Date().toISOString() },
      { id: req.params.id }
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
router.get('/:id/status', async (req, res) => {
  try {
    const contract = await findOne('contracts', { id: req.params.id });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const conditions = await findAll('conditions', { contract_id: contract.id });
    const contractSigners = await findAll('signers', { contract_id: contract.id });

    const conditionStatus = conditions.map(c => ({
      id: c.id,
      type: c.type,
      logicOperator: c.logic_operator,
      isMet: !!c.is_met,
      metAt: c.met_at,
      params: JSON.parse(c.params),
    }));

    const signerStatus = contractSigners.map(s => ({
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
  } catch (err) {
    logger.error('Status check error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
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

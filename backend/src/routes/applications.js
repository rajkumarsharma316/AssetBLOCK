import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findOne, findAll, run, insert } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { createEscrow, buildFundTransaction, markFunded } from '../services/escrow.js';
import { createNotification } from '../services/notifications.js';
import logger from '../utils/logger.js';

const router = Router();

// All application routes require authentication
router.use(authMiddleware);

/**
 * POST /api/applications
 * Freelancer applies to a job.
 */
router.post('/', async (req, res) => {
  try {
    const { jobId, proposal, bidAmount } = req.body;

    // Validation
    if (!jobId) return res.status(400).json({ error: 'jobId is required' });
    if (!proposal) return res.status(400).json({ error: 'Proposal is required' });
    if (!bidAmount || parseFloat(bidAmount) <= 0) return res.status(400).json({ error: 'Valid bid amount is required' });

    const job = await findOne('jobs', { id: jobId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ error: 'This job is no longer accepting applications' });

    // Freelancer cannot apply to their own job
    if (job.client_public_key === req.user.publicKey) {
      return res.status(400).json({ error: 'You cannot apply to your own job' });
    }

    // Check if already applied
    const existing = await findAll('applications', {
      job_id: jobId,
      freelancer_public_key: req.user.publicKey,
    });
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }

    const applicationId = uuidv4();

    const application = await insert('applications', {
      id: applicationId,
      job_id: jobId,
      freelancer_public_key: req.user.publicKey,
      proposal,
      bid_amount: String(bidAmount),
      status: 'pending',
    });

    // Notify the job poster
    await createNotification(
      job.client_public_key,
      null,
      `New application received for "${job.title}" from ${req.user.publicKey.substring(0, 8)}...`
    );

    logger.info('Application submitted', { applicationId, jobId });

    res.status(201).json({ application });
  } catch (err) {
    logger.error('Failed to submit application', { error: err.message });
    res.status(500).json({ error: 'Failed to submit application: ' + err.message });
  }
});

/**
 * GET /api/applications/my
 * Get all applications submitted by the current user (freelancer view).
 */
router.get('/my', async (req, res) => {
  try {
    const applications = await findAll('applications', {
      freelancer_public_key: req.user.publicKey,
    }, {
      orderBy: 'created_at',
      ascending: false,
    });

    // Attach job info to each application
    const result = [];
    for (const app of applications) {
      const job = await findOne('jobs', { id: app.job_id });
      result.push({
        ...app,
        job: job ? {
          id: job.id,
          title: job.title,
          budget: job.budget,
          asset_code: job.asset_code,
          status: job.status,
          client_public_key: job.client_public_key,
          contract_id: job.contract_id,
        } : null,
      });
    }

    res.json({ applications: result });
  } catch (err) {
    logger.error('Failed to list applications', { error: err.message });
    res.status(500).json({ error: 'Failed to list applications: ' + err.message });
  }
});

/**
 * POST /api/applications/:id/accept
 * Client accepts a freelancer's application.
 * This creates an escrow contract and links it to the job.
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const application = await findOne('applications', { id: req.params.id });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const job = await findOne('jobs', { id: application.job_id });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Only the job poster can accept
    if (job.client_public_key !== req.user.publicKey) {
      return res.status(403).json({ error: 'Only the job poster can accept applications' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'This job has already been assigned or completed' });
    }

    // 1. Create the escrow contract in the contracts table
    const contractId = uuidv4();
    await insert('contracts', {
      id: contractId,
      creator_public_key: req.user.publicKey,
      title: `Job Escrow: ${job.title}`,
      description: `Escrow for job "${job.title}". Freelancer: ${application.freelancer_public_key.substring(0, 8)}...`,
      amount: application.bid_amount,
      asset_code: job.asset_code || 'XLM',
      asset_issuer: null,
      destination: application.freelancer_public_key,
      status: 'pending',
    });

    // 2. Add conditions: approval-based (client must approve work completion)
    await insert('conditions', {
      id: uuidv4(),
      contract_id: contractId,
      type: 'approval',
      logic_operator: 'AND',
      logic_group: 0,
      params: JSON.stringify({
        requiredApprovals: 1,
        currentApprovals: 0,
        description: 'Client approves completed work',
      }),
      is_met: false,
    });

    // 3. Add signers (client + freelancer)
    await insert('signers', {
      id: uuidv4(),
      contract_id: contractId,
      public_key: req.user.publicKey,
      weight: 1,
      has_signed: false,
    });
    await insert('signers', {
      id: uuidv4(),
      contract_id: contractId,
      public_key: application.freelancer_public_key,
      weight: 1,
      has_signed: false,
    });

    // 4. Create the Stellar escrow account
    const escrowResult = await createEscrow(
      contractId,
      [application.freelancer_public_key],
      req.user.publicKey,
      1 // threshold: only client approval needed to release
    );

    // 5. Update job status and link to contract
    await run('jobs',
      { status: 'assigned', contract_id: contractId, updated_at: new Date().toISOString() },
      { id: job.id }
    );

    // 6. Accept this application, reject all others
    await run('applications',
      { status: 'accepted' },
      { id: req.params.id }
    );
    // Reject other pending applications for this job
    const otherApps = await findAll('applications', { job_id: job.id, status: 'pending' });
    for (const other of otherApps) {
      if (other.id !== req.params.id) {
        await run('applications', { status: 'rejected' }, { id: other.id });
      }
    }

    // 7. Notify the freelancer
    await createNotification(
      application.freelancer_public_key,
      contractId,
      `Your application for "${job.title}" has been accepted! The escrow has been created.`
    );

    logger.info('Application accepted, escrow created', {
      applicationId: req.params.id,
      jobId: job.id,
      contractId,
    });

    res.json({
      success: true,
      message: 'Application accepted and escrow created',
      contractId,
      escrow: escrowResult,
    });
  } catch (err) {
    logger.error('Accept application error', { error: err.message });
    res.status(500).json({ error: 'Failed to accept application: ' + err.message });
  }
});

/**
 * POST /api/applications/:id/reject
 * Client rejects a freelancer's application.
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const application = await findOne('applications', { id: req.params.id });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const job = await findOne('jobs', { id: application.job_id });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.client_public_key !== req.user.publicKey) {
      return res.status(403).json({ error: 'Only the job poster can reject applications' });
    }

    await run('applications', { status: 'rejected' }, { id: req.params.id });

    await createNotification(
      application.freelancer_public_key,
      null,
      `Your application for "${job.title}" was not selected.`
    );

    logger.info('Application rejected', { applicationId: req.params.id });
    res.json({ success: true, message: 'Application rejected' });
  } catch (err) {
    logger.error('Reject application error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;

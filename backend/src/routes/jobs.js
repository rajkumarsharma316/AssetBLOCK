import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findOne, findAll, run, insert } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

/**
 * POST /api/jobs
 * Client posts a new job listing.
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      assetCode = 'XLM',
      skills = [],
      deadline,
    } = req.body;

    // Validation
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!description) return res.status(400).json({ error: 'Description is required' });
    if (!budget || parseFloat(budget) <= 0) return res.status(400).json({ error: 'Valid budget is required' });

    const jobId = uuidv4();

    const job = await insert('jobs', {
      id: jobId,
      client_public_key: req.user.publicKey,
      title,
      description,
      budget: String(budget),
      asset_code: assetCode,
      skills: JSON.stringify(skills),
      deadline: deadline || null,
      status: 'open',
    });

    logger.info('Job created', { jobId, title });

    res.status(201).json({ job });
  } catch (err) {
    logger.error('Failed to create job', { error: err.message });
    res.status(500).json({ error: 'Failed to create job: ' + err.message });
  }
});

/**
 * GET /api/jobs
 * List all open jobs, or filter by status / search.
 */
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, my } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // If ?my=true, return only jobs posted by the current user
    const filters = {};
    if (my === 'true') {
      filters.client_public_key = req.user.publicKey;
    }
    if (status) {
      filters.status = status;
    }

    let jobs = await findAll('jobs', filters, {
      orderBy: 'created_at',
      ascending: false,
      limit: parseInt(limit),
      offset,
    });

    // Simple search filter on title/description (client-side for now)
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Attach application count to each job
    const result = [];
    for (const job of jobs) {
      const applications = await findAll('applications', { job_id: job.id });
      result.push({
        ...job,
        skills: job.skills ? JSON.parse(job.skills) : [],
        applicationCount: applications.length,
      });
    }

    res.json({ jobs: result });
  } catch (err) {
    logger.error('Failed to list jobs', { error: err.message });
    res.status(500).json({ error: 'Failed to list jobs: ' + err.message });
  }
});

/**
 * GET /api/jobs/:id
 * Get detailed info for a specific job, including applications (for job owner).
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await findOne('jobs', { id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const applications = await findAll('applications', { job_id: job.id }, {
      orderBy: 'created_at',
      ascending: false,
    });

    // Only reveal full application details to the job poster
    const isOwner = job.client_public_key === req.user.publicKey;

    // Check if current user has already applied
    const userApplication = applications.find(
      (a) => a.freelancer_public_key === req.user.publicKey
    );

    res.json({
      job: {
        ...job,
        skills: job.skills ? JSON.parse(job.skills) : [],
      },
      applications: isOwner ? applications : [],
      applicationCount: applications.length,
      isOwner,
      hasApplied: !!userApplication,
      userApplication: userApplication || null,
    });
  } catch (err) {
    logger.error('Failed to get job', { error: err.message });
    res.status(500).json({ error: 'Failed to get job: ' + err.message });
  }
});

/**
 * POST /api/jobs/:id/cancel
 * Client cancels an open job listing.
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const job = await findOne('jobs', { id: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.client_public_key !== req.user.publicKey) {
      return res.status(403).json({ error: 'Only the client can cancel this job' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Can only cancel open jobs' });
    }

    await run('jobs',
      { status: 'cancelled', updated_at: new Date().toISOString() },
      { id: req.params.id }
    );

    // Reject all pending applications
    await run('applications',
      { status: 'rejected' },
      { job_id: req.params.id, status: 'pending' }
    );

    logger.info('Job cancelled', { jobId: req.params.id });
    res.json({ success: true, message: 'Job cancelled' });
  } catch (err) {
    logger.error('Cancel job error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;

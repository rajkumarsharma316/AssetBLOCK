import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Keypair, TransactionBuilder, Networks, Account, Transaction, Operation } from '@stellar/stellar-sdk';
import { v4 as uuidv4 } from 'uuid';
import { findOne, insert } from '../db/database.js';
import { getNotifications, markRead, markAllRead } from '../services/notifications.js';
import { authMiddleware } from '../middleware/auth.js';
import stellarService from '../services/stellar.js';
import config from '../config.js';
import logger from '../utils/logger.js';

const router = Router();

// Store pending challenges (in production, use Redis)
const pendingChallenges = new Map();

/**
 * POST /api/auth/challenge
 * Generate a challenge for the user to sign with their wallet.
 */
router.post('/challenge', (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) {
    return res.status(400).json({ error: 'publicKey is required' });
  }

  // Validate it's a valid Stellar public key
  try {
    Keypair.fromPublicKey(publicKey);
  } catch {
    return res.status(400).json({ error: 'Invalid Stellar public key' });
  }

  // Build a dummy auth transaction for Freighter to sign
  const tempAccount = new Account(publicKey, "0");
  const tx = new TransactionBuilder(tempAccount, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.manageData({
      name: 'Auth_Challenge',
      value: `${uuidv4()}`.substring(0, 32),
      source: publicKey
    }))
    .setTimeout(300)
    .build();

  const challenge = tx.toXDR();
  pendingChallenges.set(publicKey, { challenge, createdAt: Date.now() });

  // Clean up old challenges (older than 5 minutes)
  for (const [key, val] of pendingChallenges) {
    if (Date.now() - val.createdAt > 5 * 60 * 1000) {
      pendingChallenges.delete(key);
    }
  }

  res.json({ challenge });
});

/**
 * POST /api/auth/login
 * Verify the signed challenge and issue a JWT.
 * Supports two modes:
 * 1. Freighter: verify signature of the challenge
 * 2. Direct: accept secret key (testnet only)
 */
router.post('/login', (req, res) => {
  const { publicKey, signedChallenge, secretKey } = req.body;

  if (!publicKey) {
    return res.status(400).json({ error: 'publicKey is required' });
  }

  let verified = false;

  if (secretKey) {
    // Direct mode: verify the secret key matches the public key
    try {
      const kp = Keypair.fromSecret(secretKey);
      if (kp.publicKey() === publicKey) {
        verified = true;
      }
    } catch {
      return res.status(400).json({ error: 'Invalid secret key' });
    }
  } else if (signedChallenge) {
    // Freighter mode: verify the signature
    const pending = pendingChallenges.get(publicKey);
    if (!pending) {
      return res.status(400).json({ error: 'No pending challenge. Request a challenge first.' });
    }

    try {
      // Freighter mode: verify the signature within the signed XDR
      const signedTx = new Transaction(signedChallenge, Networks.TESTNET);
      
      // Extract the signatures
      const signatures = signedTx.signatures;
      if (signatures.length > 0) {
        const kp = Keypair.fromPublicKey(publicKey);
        const txHash = signedTx.hash();
        verified = kp.verify(txHash, signatures[0].signature());
      }
    } catch (err) {
      console.error("Signature verification error:", err);
      verified = false;
    }

    pendingChallenges.delete(publicKey);
  } else {
    return res.status(400).json({ error: 'Either signedChallenge or secretKey is required' });
  }

  if (!verified) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  // Ensure user exists
  let user = findOne('SELECT * FROM users WHERE public_key = ?', [publicKey]);
  if (!user) {
    const userId = uuidv4();
    insert('users', { id: userId, public_key: publicKey });
    user = { id: userId, public_key: publicKey };
  }

  // Issue JWT
  const token = jwt.sign(
    { userId: user.id, publicKey: user.public_key },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  logger.info('User authenticated', { publicKey });

  res.json({
    token,
    user: {
      id: user.id,
      publicKey: user.public_key,
    },
  });
});

/**
 * GET /api/auth/me
 * Get current user info.
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const balances = await stellarService.getBalance(req.user.publicKey);
    const xlmBalance = balances.find(b => b.asset_type === 'native');

    res.json({
      publicKey: req.user.publicKey,
      userId: req.user.userId,
      balance: xlmBalance ? xlmBalance.balance : '0',
      balances,
    });
  } catch (err) {
    res.json({
      publicKey: req.user.publicKey,
      userId: req.user.userId,
      balance: '0',
      balances: [],
    });
  }
});

/**
 * GET /api/auth/notifications
 * Get notifications for the current user.
 */
router.get('/notifications', authMiddleware, (req, res) => {
  const notifications = getNotifications(req.user.publicKey, req.query.all === 'true');
  res.json({ notifications });
});

/**
 * POST /api/auth/notifications/:id/read
 * Mark a notification as read.
 */
router.post('/notifications/:id/read', authMiddleware, (req, res) => {
  markRead(req.params.id);
  res.json({ success: true });
});

/**
 * POST /api/auth/notifications/read-all
 * Mark all notifications as read.
 */
router.post('/notifications/read-all', authMiddleware, (req, res) => {
  markAllRead(req.user.publicKey);
  res.json({ success: true });
});

/**
 * POST /api/auth/fund-testnet
 * Fund the user's account via Friendbot (testnet only).
 */
router.post('/fund-testnet', authMiddleware, async (req, res) => {
  try {
    await stellarService.fundWithFriendbot(req.user.publicKey);
    res.json({ success: true, message: 'Account funded on testnet' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fund account: ' + err.message });
  }
});

export default router;

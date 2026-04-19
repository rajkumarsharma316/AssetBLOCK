import jwt from 'jsonwebtoken';
import config from '../config.js';
import logger from '../utils/logger.js';

/**
 * JWT authentication middleware.
 * Extracts the public key from the token and attaches to req.user.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      publicKey: decoded.publicKey,
      userId: decoded.userId,
    };
    next();
  } catch (err) {
    logger.warn('Invalid token', { error: err.message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default authMiddleware;

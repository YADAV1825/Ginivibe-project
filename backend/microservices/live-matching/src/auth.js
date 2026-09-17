/**
 * JWT Authentication Module
 * 
 * Handles token generation, verification, and middleware for the signaling server.
 * 
 * Flow:
 *   1. Your Next.js/React app calls POST /auth/token with user credentials
 *   2. Server returns a signed JWT
 *   3. Client connects to WebSocket with: ws://host:port?token=JWT_TOKEN
 *   4. Server verifies the token on WebSocket upgrade
 *
 * In production, replace the user validation logic in generateToken() 
 * with your actual database/auth provider lookup.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');

// Generate a random secret if none is provided (auto-generated on first run)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set — using auto-generated secret. Tokens will invalidate on server restart.', {
    hint: 'Set JWT_SECRET in .env for persistent tokens',
  });
}

const auth = {
  /**
   * Generate a JWT token for a user
   * @param {object} payload - { userId, displayName, ...any custom fields }
   * @returns {string} JWT token
   */
  generateToken(payload) {
    return jwt.sign(
      {
        userId: payload.userId,
        displayName: payload.displayName || 'Anonymous',
        ...payload,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  },

  /**
   * Verify a JWT token
   * @param {string} token
   * @returns {{ valid: boolean, payload?: object, error?: string }}
   */
  verifyToken(token) {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return { valid: true, payload };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return { valid: false, error: 'Token expired' };
      }
      if (err.name === 'JsonWebTokenError') {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  },

  /**
   * Express middleware to protect HTTP endpoints
   * Extracts token from Authorization header: Bearer <token>
   */
  requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7);
    const result = auth.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    req.user = result.payload;
    next();
  },

  /**
   * Verify WebSocket connection token
   * Called during WebSocket upgrade handshake
   * @param {string} token - from ws://host:port?token=XXX
   * @returns {boolean}
   */
  verifyWebSocketToken(token) {
    const result = auth.verifyToken(token);
    if (!result.valid) {
      logger.warn('WebSocket auth failed', { error: result.error });
      return false;
    }
    logger.debug('WebSocket auth success', { userId: result.payload.userId });
    return true;
  },

  /**
   * Get the secret (for testing/debug only)
   */
  getSecret() {
    return JWT_SECRET;
  },
};

module.exports = auth;

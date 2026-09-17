/**
 * Rate Limiter
 * - Per-IP connection limiting (prevents a single IP from hogging connections)
 * - Per-client message rate limiting using token bucket algorithm
 */

const logger = require('./logger');

class RateLimiter {
  constructor(options = {}) {
    this.maxConnectionsPerIp = options.maxConnectionsPerIp || 5;
    this.messageRateLimit = options.messageRateLimit || 20;
    this.messageRateWindowMs = options.messageRateWindowMs || 1000;

    // Track connections per IP: Map<ip, Set<userId>>
    this.ipConnections = new Map();

    // Track message rates per user: Map<userId, { tokens, lastRefill }>
    this.messageBuckets = new Map();
  }

  /**
   * Check if a new connection from this IP is allowed
   * @param {string} ip
   * @returns {boolean}
   */
  canConnect(ip) {
    const connections = this.ipConnections.get(ip);
    if (!connections) return true;
    return connections.size < this.maxConnectionsPerIp;
  }

  /**
   * Register a new connection from an IP
   * @param {string} ip
   * @param {string} userId
   */
  addConnection(ip, userId) {
    if (!this.ipConnections.has(ip)) {
      this.ipConnections.set(ip, new Set());
    }
    this.ipConnections.get(ip).add(userId);

    // Initialize message rate bucket
    this.messageBuckets.set(userId, {
      tokens: this.messageRateLimit,
      lastRefill: Date.now(),
    });
  }

  /**
   * Remove a connection
   * @param {string} ip
   * @param {string} userId
   */
  removeConnection(ip, userId) {
    const connections = this.ipConnections.get(ip);
    if (connections) {
      connections.delete(userId);
      if (connections.size === 0) {
        this.ipConnections.delete(ip);
      }
    }
    this.messageBuckets.delete(userId);
  }

  /**
   * Check if a user can send a message (token bucket)
   * @param {string} userId
   * @returns {boolean}
   */
  canSendMessage(userId) {
    const bucket = this.messageBuckets.get(userId);
    if (!bucket) return false;

    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const refill = Math.floor((elapsed / this.messageRateWindowMs) * this.messageRateLimit);

    if (refill > 0) {
      bucket.tokens = Math.min(this.messageRateLimit, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return true;
    }

    logger.warn('Rate limit exceeded', { userId });
    return false;
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    let totalConnections = 0;
    for (const connections of this.ipConnections.values()) {
      totalConnections += connections.size;
    }
    return {
      uniqueIps: this.ipConnections.size,
      totalTrackedConnections: totalConnections,
    };
  }
}

module.exports = RateLimiter;

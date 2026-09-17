/**
 * Redis Pub/Sub Adapter
 * Enables horizontal scaling across multiple server instances.
 * When User A is on Server 1 and User B is on Server 2,
 * Redis relays signaling messages between them.
 *
 * If Redis is not configured, falls back to in-process only (single server mode).
 */

const logger = require('./logger');

class RedisAdapter {
  constructor(options = {}) {
    this.enabled = false;
    this.pub = null;
    this.sub = null;
    this.serverId = options.serverId || `server-${process.pid}`;
    this.channel = options.channel || 'videocall:signaling';
    this._messageHandler = null;
  }

  /**
   * Initialize Redis connections
   * @param {string} redisUrl - Redis connection URL
   */
  async init(redisUrl) {
    if (!redisUrl) {
      logger.info('Redis not configured — running in single-server mode');
      return;
    }

    try {
      // Dynamic import so Redis is optional
      const { createClient } = require('redis');

      this.pub = createClient({ url: redisUrl });
      this.sub = this.pub.duplicate();

      this.pub.on('error', (err) => logger.error('Redis pub error', { error: err.message }));
      this.sub.on('error', (err) => logger.error('Redis sub error', { error: err.message }));

      await this.pub.connect();
      await this.sub.connect();

      // Subscribe to the signaling channel
      await this.sub.subscribe(this.channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          // Ignore messages from ourselves
          if (parsed._serverId === this.serverId) return;
          if (this._messageHandler) {
            this._messageHandler(parsed);
          }
        } catch (e) {
          logger.error('Redis message parse error', { error: e.message });
        }
      });

      this.enabled = true;
      logger.info('Redis adapter initialized', { serverId: this.serverId, channel: this.channel });
    } catch (err) {
      logger.warn('Redis connection failed — falling back to single-server mode', {
        error: err.message,
      });
      this.enabled = false;
    }
  }

  /**
   * Publish a signaling message to other server instances
   * @param {string} targetUserId - the user this message is for
   * @param {object} message - the signaling message
   */
  async publish(targetUserId, message) {
    if (!this.enabled) return;

    try {
      await this.pub.publish(
        this.channel,
        JSON.stringify({
          _serverId: this.serverId,
          targetUserId,
          message,
        })
      );
    } catch (err) {
      logger.error('Redis publish error', { error: err.message });
    }
  }

  /**
   * Set handler for messages from other server instances
   * @param {function} handler - (parsed) => void
   */
  onMessage(handler) {
    this._messageHandler = handler;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (!this.enabled) return;

    try {
      await this.sub.unsubscribe(this.channel);
      await this.sub.quit();
      await this.pub.quit();
      logger.info('Redis adapter shut down');
    } catch (err) {
      logger.error('Redis shutdown error', { error: err.message });
    }
  }
}

module.exports = RedisAdapter;

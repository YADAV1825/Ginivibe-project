/**
 * Match Queue
 * FIFO queue for random user matching.
 * When 2 users are in the queue, they are automatically matched into a room.
 */

const logger = require('./logger');

class MatchQueue {
  constructor(roomManager) {
    this.roomManager = roomManager;

    // Queue of waiting users: Array<{ userId, ws, joinedAt }>
    this.queue = [];

    // Set of userIds in queue for O(1) lookup
    this.userSet = new Set();
  }

  /**
   * Add a user to the matching queue.
   * If there's already someone waiting, they are matched immediately.
   * @param {string} userId
   * @param {object} ws - WebSocket connection
   * @returns {{ matched: boolean, roomCode?: string, peerId?: string, peerWs?: object }}
   */
  enqueue(userId, ws) {
    // Don't add if already in queue
    if (this.userSet.has(userId)) {
      return { matched: false };
    }

    // Remove user from any existing room
    this.roomManager.leaveRoom(userId);

    // Check if there's someone waiting to be matched
    while (this.queue.length > 0) {
      const peer = this.queue.shift();
      this.userSet.delete(peer.userId);

      // Verify the peer is still connected
      if (peer.ws.readyState === peer.ws.OPEN) {
        // Match found! Create a room with both users
        const roomCode = this.roomManager.createAndJoin(peer.userId, peer.ws);
        const joinResult = this.roomManager.joinRoom(roomCode, userId, ws);

        if (joinResult.success) {
          logger.info('Users matched from queue', {
            user1: peer.userId,
            user2: userId,
            roomCode,
          });

          return {
            matched: true,
            roomCode,
            peerId: peer.userId,
            peerWs: peer.ws,
          };
        }
      }
      // If peer was disconnected, skip and try next in queue
      logger.debug('Skipped disconnected peer in queue', { peerId: peer.userId });
    }

    // No match found, add to queue
    this.queue.push({ userId, ws, joinedAt: Date.now() });
    this.userSet.add(userId);

    logger.info('User added to match queue', { userId, queueSize: this.queue.length });

    return { matched: false };
  }

  /**
   * Remove a user from the queue
   * @param {string} userId
   * @returns {boolean} whether the user was in the queue
   */
  dequeue(userId) {
    if (!this.userSet.has(userId)) return false;

    this.queue = this.queue.filter((entry) => entry.userId !== userId);
    this.userSet.delete(userId);

    logger.debug('User removed from match queue', { userId, queueSize: this.queue.length });
    return true;
  }

  /**
   * Check if a user is in the queue
   * @param {string} userId
   * @returns {boolean}
   */
  isInQueue(userId) {
    return this.userSet.has(userId);
  }

  /**
   * Get the current queue position for a user (1-indexed)
   * @param {string} userId
   * @returns {number} position (0 if not in queue)
   */
  getPosition(userId) {
    if (!this.userSet.has(userId)) return 0;
    const idx = this.queue.findIndex((entry) => entry.userId === userId);
    return idx + 1;
  }

  /**
   * Clean up stale entries (users who disconnected while in queue)
   */
  cleanup() {
    const before = this.queue.length;
    this.queue = this.queue.filter((entry) => {
      if (entry.ws.readyState !== entry.ws.OPEN) {
        this.userSet.delete(entry.userId);
        return false;
      }
      return true;
    });

    const removed = before - this.queue.length;
    if (removed > 0) {
      logger.info('Cleaned stale queue entries', { removed, remaining: this.queue.length });
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      queueSize: this.queue.length,
    };
  }
}

module.exports = MatchQueue;

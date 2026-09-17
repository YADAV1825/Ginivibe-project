/**
 * Room Manager
 * Manages video call rooms with strict 2-person limit.
 * Uses Map for O(1) lookups — efficient at scale.
 *
 * Room lifecycle:
 *   created → waiting (1 user) → active (2 users) → destroyed (call ended)
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class RoomManager {
  constructor() {
    // Map<roomCode, Room>
    this.rooms = new Map();

    // Map<userId, roomCode> — quick lookup of which room a user is in
    this.userRooms = new Map();
  }

  /**
   * Create a new room
   * @param {string} creatorId - userId of the creator
   * @returns {{ roomCode: string }}
   */
  createRoom(creatorId) {
    // If user is already in a room, leave it first
    this.leaveRoom(creatorId);

    const roomCode = this._generateRoomCode();

    const room = {
      code: roomCode,
      participants: new Map(), // Map<userId, WebSocket>
      createdAt: Date.now(),
      state: 'waiting', // waiting | active
    };

    this.rooms.set(roomCode, room);
    logger.info('Room created', { roomCode, creatorId });

    return { roomCode };
  }

  /**
   * Join an existing room
   * @param {string} roomCode
   * @param {string} userId
   * @param {object} ws - WebSocket connection
   * @returns {{ success: boolean, error?: string, room?: object }}
   */
  joinRoom(roomCode, userId, ws) {
    // If user is already in a room, leave it first
    this.leaveRoom(userId);

    let room = this.rooms.get(roomCode);

    if (!room) {
      // Create the room on the fly if it doesn't exist
      room = {
        code: roomCode,
        participants: new Map(),
        createdAt: Date.now(),
        state: 'waiting',
      };
      this.rooms.set(roomCode, room);
      logger.info('Room created on the fly during join', { roomCode, userId });
    }

    if (room.participants.size >= 2) {
      return { success: false, error: 'Room is full' };
    }

    if (room.participants.has(userId)) {
      return { success: false, error: 'Already in this room' };
    }

    room.participants.set(userId, ws);
    this.userRooms.set(userId, roomCode);

    if (room.participants.size === 2) {
      room.state = 'active';
      logger.info('Room is now active (2 participants)', { roomCode });
    }

    logger.info('User joined room', { roomCode, userId, participants: room.participants.size });

    return { success: true, room };
  }

  /**
   * Create a room and immediately add a user to it
   * Used by the match queue for auto-matching
   * @param {string} userId
   * @param {object} ws
   * @returns {string} roomCode
   */
  createAndJoin(userId, ws) {
    const { roomCode } = this.createRoom(userId);
    this.joinRoom(roomCode, userId, ws);
    return roomCode;
  }

  /**
   * Remove a user from their current room
   * @param {string} userId
   * @returns {{ roomCode?: string, peerId?: string, peerWs?: object }}
   */
  leaveRoom(userId) {
    const roomCode = this.userRooms.get(userId);
    if (!roomCode) return {};

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.userRooms.delete(userId);
      return {};
    }

    room.participants.delete(userId);
    this.userRooms.delete(userId);

    // Find the remaining peer (if any)
    let peerId = null;
    let peerWs = null;
    for (const [id, ws] of room.participants) {
      peerId = id;
      peerWs = ws;
      break;
    }

    // If room is now empty, destroy it
    if (room.participants.size === 0) {
      this.rooms.delete(roomCode);
      logger.info('Room destroyed (empty)', { roomCode });
    } else {
      room.state = 'waiting';
      logger.info('User left room', { roomCode, userId, remainingPeer: peerId });
    }

    return { roomCode, peerId, peerWs };
  }

  /**
   * Get the peer's WebSocket in the same room
   * @param {string} userId
   * @returns {{ peerId: string, peerWs: object } | null}
   */
  getPeer(userId) {
    const roomCode = this.userRooms.get(userId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    for (const [id, ws] of room.participants) {
      if (id !== userId) {
        return { peerId: id, peerWs: ws };
      }
    }

    return null;
  }

  /**
   * Get the room a user is currently in
   * @param {string} userId
   * @returns {object | null}
   */
  getUserRoom(userId) {
    const roomCode = this.userRooms.get(userId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Check if a room exists
   * @param {string} roomCode
   * @returns {boolean}
   */
  roomExists(roomCode) {
    return this.rooms.has(roomCode);
  }

  /**
   * Check if a room is joinable (exists and not full)
   * @param {string} roomCode
   * @returns {boolean}
   */
  isRoomJoinable(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    return room.participants.size < 2;
  }

  /**
   * Generate a short, human-readable room code
   * @returns {string}
   */
  _generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code)); // Ensure uniqueness
    return code;
  }

  /**
   * Clean up rooms older than maxAge that are still in 'waiting' state
   * @param {number} maxAgeMs - max age in milliseconds
   */
  cleanupStaleRooms(maxAgeMs = 5 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [code, room] of this.rooms) {
      if (room.state === 'waiting' && now - room.createdAt > maxAgeMs) {
        // Notify any waiting user
        for (const [userId, ws] of room.participants) {
          this.userRooms.delete(userId);
          try {
            ws.send(JSON.stringify({ type: 'error', message: 'Room expired due to inactivity' }));
          } catch (e) {
            // Connection might be dead already
          }
        }
        this.rooms.delete(code);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up stale rooms', { count: cleaned });
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    let activeRooms = 0;
    let waitingRooms = 0;

    for (const room of this.rooms.values()) {
      if (room.state === 'active') activeRooms++;
      else waitingRooms++;
    }

    return {
      totalRooms: this.rooms.size,
      activeRooms,
      waitingRooms,
      connectedUsers: this.userRooms.size,
    };
  }
}

module.exports = RoomManager;

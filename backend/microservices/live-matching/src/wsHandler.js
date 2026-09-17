/**
 * WebSocket Connection Handler
 * Manages individual WebSocket connections:
 * - Message routing
 * - Rate limiting
 * - Heartbeat (ping/pong)
 * - Clean disconnect handling
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB max message size

class WSHandler {
  constructor({ roomManager, matchQueue, signaling, rateLimiter, iceServers }) {
    this.roomManager = roomManager;
    this.matchQueue = matchQueue;
    this.signaling = signaling;
    this.rateLimiter = rateLimiter;
    this.iceServers = iceServers;

    // Map<userId, WebSocket> — all connected clients
    this.clients = new Map();
  }

  /**
   * Handle a new WebSocket connection
   * @param {object} ws - WebSocket
   * @param {object} req - HTTP request (for IP extraction)
   */
  handleConnection(ws, req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

    // Rate limit: check per-IP connection limit
    if (!this.rateLimiter.canConnect(ip)) {
      logger.warn('Connection rejected: IP rate limit', { ip });
      ws.close(4029, 'Too many connections from your IP');
      return;
    }

    // Assign a unique user ID
    const userId = uuidv4();
    ws.userId = userId;
    ws.ip = ip;
    ws.isAlive = true;

    this.clients.set(userId, ws);
    this.rateLimiter.addConnection(ip, userId);

    // Send welcome message with userId and ICE server config
    this._send(ws, {
      type: 'welcome',
      userId,
      iceServers: this.iceServers,
    });

    logger.info('Client connected', { userId, ip, totalClients: this.clients.size });

    // Set up event handlers
    ws.on('message', (raw) => this._handleMessage(ws, userId, ip, raw));
    ws.on('close', () => this._handleDisconnect(ws, userId, ip));
    ws.on('error', (err) => {
      logger.error('WebSocket error', { userId, error: err.message });
    });
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  }

  /**
   * Handle an incoming message
   */
  _handleMessage(ws, userId, ip, raw) {
    // Check message size
    if (raw.length > MAX_MESSAGE_SIZE) {
      this._send(ws, { type: 'error', message: 'Message too large' });
      return;
    }

    // Rate limit messages
    if (!this.rateLimiter.canSendMessage(userId)) {
      this._send(ws, { type: 'error', message: 'Rate limit exceeded. Slow down.' });
      return;
    }

    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (e) {
      this._send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (!data.type) {
      this._send(ws, { type: 'error', message: 'Missing message type' });
      return;
    }

    // Route message to handler
    switch (data.type) {
      case 'join-queue':
        this._handleJoinQueue(ws, userId);
        break;

      case 'leave-queue':
        this._handleLeaveQueue(userId);
        break;

      case 'create-room':
        this._handleCreateRoom(ws, userId);
        break;

      case 'join-room':
        this._handleJoinRoom(ws, userId, data);
        break;

      case 'offer':
        this._handleSignaling(userId, 'handleOffer', data);
        break;

      case 'answer':
        this._handleSignaling(userId, 'handleAnswer', data);
        break;

      case 'ice-candidate':
        this._handleSignaling(userId, 'handleIceCandidate', data);
        break;

      case 'end-call':
        this._handleEndCall(userId);
        break;

      default:
        this._send(ws, { type: 'error', message: `Unknown message type: ${data.type}` });
    }
  }

  /**
   * Join the random matching queue
   */
  _handleJoinQueue(ws, userId) {
    const result = this.matchQueue.enqueue(userId, ws);

    if (result.matched) {
      // Both users are matched — notify them to start WebRTC
      // The first user (peer) is the initiator (creates the offer)
      this._send(result.peerWs, {
        type: 'matched',
        roomCode: result.roomCode,
        isInitiator: true,
      });

      this._send(ws, {
        type: 'matched',
        roomCode: result.roomCode,
        isInitiator: false,
      });
    } else {
      this._send(ws, {
        type: 'queue-joined',
        position: this.matchQueue.getPosition(userId),
      });
    }
  }

  /**
   * Leave the matching queue
   */
  _handleLeaveQueue(userId) {
    this.matchQueue.dequeue(userId);
  }

  /**
   * Create a new room with a code
   */
  _handleCreateRoom(ws, userId) {
    // Remove from queue if in it
    this.matchQueue.dequeue(userId);

    const { roomCode } = this.roomManager.createRoom(userId);
    this.roomManager.joinRoom(roomCode, userId, ws);

    this._send(ws, {
      type: 'room-created',
      roomCode,
    });
  }

  /**
   * Join an existing room by code
   */
  _handleJoinRoom(ws, userId, data) {
    if (!data.roomCode) {
      this._send(ws, { type: 'error', message: 'Missing roomCode' });
      return;
    }

    const roomCode = data.roomCode.toUpperCase().trim();

    // Remove from queue if in it
    this.matchQueue.dequeue(userId);

    const result = this.roomManager.joinRoom(roomCode, userId, ws);

    if (!result.success) {
      this._send(ws, { type: 'error', message: result.error });
      return;
    }

    // If room now has 2 people, start the call
    if (result.room && result.room.participants.size === 2) {
      // Notify both participants
      for (const [participantId, participantWs] of result.room.participants) {
        this._send(participantWs, {
          type: 'matched',
          roomCode,
          isInitiator: participantId !== userId, // The person already waiting creates the offer
        });
      }
    } else {
      this._send(ws, {
        type: 'room-joined',
        roomCode,
        message: 'Waiting for another participant...',
      });
    }
  }

  /**
   * Handle signaling messages (offer, answer, ice-candidate)
   */
  _handleSignaling(userId, method, data) {
    const result = this.signaling[method](userId, data);
    if (!result.success) {
      const ws = this.clients.get(userId);
      if (ws) {
        this._send(ws, { type: 'error', message: result.error });
      }
    }
  }

  /**
   * Handle end call
   */
  _handleEndCall(userId) {
    const { peerId, peerWs } = this.roomManager.leaveRoom(userId);

    if (peerWs) {
      this._send(peerWs, { type: 'peer-disconnected', reason: 'call-ended' });
    }

    // Also remove the peer from the room so they can match again
    if (peerId) {
      this.roomManager.leaveRoom(peerId);
    }

    const ws = this.clients.get(userId);
    if (ws) {
      this._send(ws, { type: 'call-ended' });
    }
  }

  /**
   * Handle client disconnect
   */
  _handleDisconnect(ws, userId, ip) {
    // Remove from queue
    this.matchQueue.dequeue(userId);

    // Leave room and notify peer
    const { peerId, peerWs } = this.roomManager.leaveRoom(userId);
    if (peerWs) {
      this._send(peerWs, { type: 'peer-disconnected', reason: 'connection-lost' });
    }

    // Also remove the peer from the now-dead room so they can match again
    if (peerId) {
      this.roomManager.leaveRoom(peerId);
    }

    // Clean up
    this.clients.delete(userId);
    this.rateLimiter.removeConnection(ip, userId);

    logger.info('Client disconnected', { userId, totalClients: this.clients.size });
  }

  /**
   * Heartbeat: ping all clients, disconnect dead ones
   */
  heartbeat() {
    for (const [userId, ws] of this.clients) {
      if (!ws.isAlive) {
        logger.warn('Terminating dead connection', { userId });
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }

  /**
   * Graceful shutdown: close all connections
   */
  shutdown() {
    logger.info('Shutting down all WebSocket connections', { count: this.clients.size });

    for (const [userId, ws] of this.clients) {
      try {
        ws.close(1001, 'Server shutting down');
      } catch (e) {
        ws.terminate();
      }
    }
    this.clients.clear();
  }

  /**
   * Safely send JSON to a WebSocket
   */
  _send(ws, data) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
      }
    } catch (err) {
      logger.error('Failed to send message', { error: err.message });
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
    };
  }
}

module.exports = WSHandler;

/**
 * Signaling Relay
 * Handles WebRTC signaling messages between matched peers:
 * - SDP Offers/Answers
 * - ICE Candidates
 *
 * All messages are validated before forwarding.
 */

const logger = require('./logger');

class Signaling {
  constructor(roomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Forward an SDP offer to the peer
   * @param {string} userId - sender
   * @param {object} data - { sdp }
   */
  handleOffer(userId, data) {
    if (!data.sdp) {
      return { success: false, error: 'Missing SDP in offer' };
    }

    const peer = this.roomManager.getPeer(userId);
    if (!peer) {
      return { success: false, error: 'No peer found. Are you in a room?' };
    }

    this._sendToPeer(peer.peerWs, {
      type: 'offer',
      sdp: data.sdp,
    });

    logger.debug('Forwarded SDP offer', { from: userId, to: peer.peerId });
    return { success: true };
  }

  /**
   * Forward an SDP answer to the peer
   * @param {string} userId - sender
   * @param {object} data - { sdp }
   */
  handleAnswer(userId, data) {
    if (!data.sdp) {
      return { success: false, error: 'Missing SDP in answer' };
    }

    const peer = this.roomManager.getPeer(userId);
    if (!peer) {
      return { success: false, error: 'No peer found. Are you in a room?' };
    }

    this._sendToPeer(peer.peerWs, {
      type: 'answer',
      sdp: data.sdp,
    });

    logger.debug('Forwarded SDP answer', { from: userId, to: peer.peerId });
    return { success: true };
  }

  /**
   * Forward an ICE candidate to the peer
   * @param {string} userId - sender
   * @param {object} data - { candidate }
   */
  handleIceCandidate(userId, data) {
    if (!data.candidate) {
      return { success: false, error: 'Missing ICE candidate' };
    }

    const peer = this.roomManager.getPeer(userId);
    if (!peer) {
      return { success: false, error: 'No peer found. Are you in a room?' };
    }

    this._sendToPeer(peer.peerWs, {
      type: 'ice-candidate',
      candidate: data.candidate,
    });

    return { success: true };
  }

  /**
   * Safely send a message to a peer
   * @param {object} ws - WebSocket
   * @param {object} message
   */
  _sendToPeer(ws, message) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (err) {
      logger.error('Failed to send message to peer', { error: err.message });
    }
  }
}

module.exports = Signaling;

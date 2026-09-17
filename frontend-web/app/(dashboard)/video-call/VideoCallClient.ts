// @ts-nocheck
/**
 * VideoCallClient — Production Grade
 *
 * Browser-side WebRTC + WebSocket signaling client.
 * Handles mobile-specific issues:
 * - App backgrounding (visibility API)
 * - Network switching (WiFi → cellular)
 * - ICE restart on connection failure
 * - Connection quality monitoring
 * - Adaptive video quality
 * - Session-based reconnection
 *
 * Usage:
 *   const client = new VideoCallClient('wss://your-server.com');
 *   client.on('remoteStream', (stream) => { videoEl.srcObject = stream; });
 *   await client.start();
 *   await client.connect();
 *   client.findMatch();
 */

class VideoCallClient {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.options = {
      reconnectMaxAttempts: options.reconnectMaxAttempts || 10,
      reconnectBaseDelay: options.reconnectBaseDelay || 1000,
      statsInterval: options.statsInterval || 3000,
      lowQualityThreshold: options.lowQualityThreshold || 50, // kbps
      authToken: options.authToken || null,
      ...options,
    };

    this.ws = null;
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.userId = null;
    this.roomCode = null;
    this.iceServers = [];
    this.isInitiator = false;

    this._listeners = {};
    this._reconnectAttempts = 0;
    this._intentionalClose = false;
    this._statsTimer = null;
    this._lastBytesReceived = 0;
    this._connectionQuality = 'unknown'; // unknown, excellent, good, poor, critical

    // Mobile: track visibility and network state
    this._isBackgrounded = false;
    this._setupMobileHandlers();
  }

  // ═══════════════════════════════════════════════════════════════
  //  EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter((cb) => cb !== callback);
    return this;
  }

  _emit(event, ...args) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((cb) => {
        try { cb(...args); } catch (e) { console.error(`Event handler error [${event}]:`, e); }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  MOBILE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  _setupMobileHandlers() {
    if (typeof document === 'undefined') return; // SSR guard

    // Handle app backgrounding (iOS/Android browsers kill WebSocket)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this._isBackgrounded = true;
        this._emit('backgrounded');
        // Stop stats monitoring to save battery
        this._stopStatsMonitoring();
      } else {
        this._isBackgrounded = false;
        this._emit('foregrounded');
        // Reconnect if WebSocket died while backgrounded
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this._attemptReconnect();
        }
        // Resume stats monitoring if in a call
        if (this.pc && this.pc.connectionState === 'connected') {
          this._startStatsMonitoring();
        }
      }
    });

    // Handle network changes (WiFi → cellular)
    if (typeof navigator !== 'undefined' && navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this._emit('networkChanged', {
          type: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
        });

        // If in a call, attempt ICE restart to re-establish through new network
        if (this.pc && this.roomCode) {
          this._attemptIceRestart();
        }
      });
    }

    // Also listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._emit('networkOnline');
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this._attemptReconnect();
        }
      });

      window.addEventListener('offline', () => {
        this._emit('networkOffline');
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  INITIALIZE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start: request camera/microphone access
   * @param {MediaStreamConstraints} constraints
   * @returns {Promise<MediaStream>}
   */
  async start(constraints?: MediaStreamConstraints) {
    const defaultConstraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user',
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    const finalConstraints = (constraints && Object.keys(constraints).length > 0) ? constraints : defaultConstraints;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      if (this._intentionalClose) {
        stream.getTracks().forEach(t => t.stop());
        return null;
      }
      this.localStream = stream;
      this._emit('localStream', this.localStream);
      return this.localStream;
    } catch (err) {
      // Fallback: try audio only if video fails
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (this._intentionalClose) {
            stream.getTracks().forEach(t => t.stop());
            return null;
          }
          this.localStream = stream;
          this._emit('localStream', this.localStream);
          this._emit('warning', { message: 'Camera unavailable — audio only mode' });
          return this.localStream;
        } catch (audioErr) {
          this._emit('error', { type: 'media', message: 'No camera or microphone access', error: audioErr });
          throw audioErr;
        }
      }
      this._emit('error', { type: 'media', message: 'Could not access camera/microphone', error: err });
      throw err;
    }
  }

  /**
   * Connect to the signaling server
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this._intentionalClose = false;

      // Build URL with optional auth token
      let url = this.serverUrl;
      if (this.options.authToken) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}token=${encodeURIComponent(this.options.authToken)}`;
      }

      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this._reconnectAttempts = 0;
        this._emit('connected');
      };

      this.ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        this._handleMessage(data);

        if (data.type === 'welcome') {
          resolve();
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this._emit('disconnected', { code: event.code, reason: event.reason });

        if (!this._intentionalClose) {
          this._attemptReconnect();
        }
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        this._emit('error', { type: 'websocket', message: 'WebSocket connection error' });
        // Don't reject here — onclose will fire and handle it
      };
    });
  }

  /**
   * Reconnect with exponential backoff
   */
  _attemptReconnect() {
    if (this._reconnectAttempts >= this.options.reconnectMaxAttempts) {
      this._emit('error', { type: 'reconnect', message: 'Max reconnection attempts reached. Please refresh.' });
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this._reconnectAttempts - 1),
      30000 // Cap at 30 seconds
    );

    this._emit('reconnecting', { attempt: this._reconnectAttempts, delay });

    setTimeout(() => {
      if (this._intentionalClose) return;

      this.connect()
        .then(() => {
          // If we were in a room, try to rejoin
          if (this.roomCode) {
            this._send({ type: 'join-room', roomCode: this.roomCode });
          }
        })
        .catch(() => {
          // Will trigger another attempt via onclose
        });
    }, delay);
  }

  // ═══════════════════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════════════════

  findMatch() {
    this._send({ type: 'join-queue' });
    this._emit('searching');
  }

  cancelSearch() {
    this._send({ type: 'leave-queue' });
    this._emit('searchCancelled');
  }

  createRoom() {
    this._send({ type: 'create-room' });
  }

  joinRoom(roomCode) {
    this._send({ type: 'join-room', roomCode: roomCode.toUpperCase().trim() });
  }

  /**
   * Toggle audio
   * @returns {boolean} true if now muted
   */
  toggleAudio() {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const muted = !track.enabled;
      this._emit('audioToggled', muted);
      return muted;
    }
    return false;
  }

  /**
   * Toggle video
   * @returns {boolean} true if video is now off
   */
  toggleVideo() {
    if (!this.localStream) return false;
    const track = this.localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const off = !track.enabled;
      this._emit('videoToggled', off);
      return off;
    }
    return false;
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacing = videoTrack.getSettings().facingMode;
    const newFacing = currentFacing === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: false,
      });

      if (this._intentionalClose) {
        newStream.getTracks().forEach(t => t.stop());
        return;
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      videoTrack.stop();

      // Replace track in peer connection
      if (this.pc) {
        const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      this._emit('cameraSwitched', newFacing);
    } catch (err) {
      this._emit('error', { type: 'media', message: 'Could not switch camera', error: err });
    }
  }

  endCall() {
    this._send({ type: 'end-call' });
    this._cleanupPeerConnection();
    this.roomCode = null;
    this._emit('callEnded', { reason: 'user' });
  }

  disconnect() {
    this._intentionalClose = true;
    this._cleanupPeerConnection();
    this._removeMobileHandlers();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  _removeMobileHandlers() {
    // Cleanup if needed — for SPA unmount
  }

  // ═══════════════════════════════════════════════════════════════
  //  MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════

  _handleMessage(data) {
    switch (data.type) {
      case 'welcome':
        this.userId = data.userId;
        this.iceServers = data.iceServers || [];
        this._emit('welcome', { userId: this.userId });
        break;

      case 'matched':
        this.roomCode = data.roomCode;
        this.isInitiator = data.isInitiator;
        this._emit('matched', { roomCode: data.roomCode, isInitiator: data.isInitiator });
        this._startWebRTC(data.isInitiator);
        break;

      case 'room-created':
        this.roomCode = data.roomCode;
        this._emit('roomCreated', { roomCode: data.roomCode });
        break;

      case 'room-joined':
        this.roomCode = data.roomCode;
        this._emit('roomJoined', { roomCode: data.roomCode, message: data.message });
        break;

      case 'queue-joined':
        this._emit('queueJoined', { position: data.position });
        break;

      case 'offer':
        this._handleOffer(data);
        break;

      case 'answer':
        this._handleAnswer(data);
        break;

      case 'ice-candidate':
        this._handleIceCandidate(data);
        break;

      case 'peer-disconnected':
        this._cleanupPeerConnection();
        this.roomCode = null;
        this._emit('peerDisconnected', { reason: data.reason });
        break;

      case 'call-ended':
        this._cleanupPeerConnection();
        this.roomCode = null;
        this._emit('callEnded', { reason: 'confirmed' });
        break;

      case 'error':
        this._emit('error', { type: 'server', message: data.message });
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  WEBRTC
  // ═══════════════════════════════════════════════════════════════

  async _startWebRTC(isInitiator) {
    this._cleanupPeerConnection();

    const config = {
      iceServers: this.iceServers.length > 0
        ? this.iceServers
        : [{ urls: 'stun:stun.l.google.com:19302' }],
      // Aggressive ICE for faster connection
      iceCandidatePoolSize: 10,
      // Bundle all media over one connection
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    this.pc = new RTCPeerConnection(config);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    // Configure video encoding for quality/bandwidth trade-off
    this._configureVideoEncoding();

    // Handle remote tracks
    this.remoteStream = new MediaStream();
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
      this._emit('remoteStream', this.remoteStream);
    };

    // ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this._send({ type: 'ice-candidate', candidate: event.candidate });
      }
    };

    // Connection state
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      this._emit('connectionState', state);

      switch (state) {
        case 'connected':
          this._emit('callStarted');
          this._startStatsMonitoring();
          break;
        case 'disconnected':
          // Don't end call immediately — try ICE restart first
          this._emit('callInterrupted');
          this._attemptIceRestart();
          break;
        case 'failed':
          this._emit('callFailed', { state });
          this._cleanupPeerConnection();
          break;
        case 'closed':
          this._stopStatsMonitoring();
          break;
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      this._emit('iceState', this.pc?.iceConnectionState);
    };

    // Create offer if initiator
    if (isInitiator) {
      try {
        const offer = await this.pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await this.pc.setLocalDescription(offer);
        this._send({ type: 'offer', sdp: this.pc.localDescription });
      } catch (err) {
        this._emit('error', { type: 'webrtc', message: 'Failed to create offer', error: err });
      }
    }
  }

  /**
   * Configure video encoding parameters for optimal quality
   */
  _configureVideoEncoding() {
    if (!this.pc) return;

    const senders = this.pc.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === 'video');
    if (!videoSender) return;

    try {
      const params = videoSender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      // Set reasonable defaults
      params.encodings[0].maxBitrate = 1500000; // 1.5 Mbps for 720p
      params.encodings[0].maxFramerate = 30;

      videoSender.setParameters(params).catch(() => {
        // Some browsers don't support this yet — that's fine
      });
    } catch (e) {
      // Ignore — encoding params not supported
    }
  }

  /**
   * Attempt ICE restart to recover from network changes
   */
  async _attemptIceRestart() {
    if (!this.pc || this.pc.connectionState === 'closed') return;

    try {
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      this._send({ type: 'offer', sdp: this.pc.localDescription });
      this._emit('iceRestarting');
    } catch (err) {
      this._emit('error', { type: 'webrtc', message: 'ICE restart failed', error: err });
    }
  }

  async _handleOffer(data) {
    if (!this.pc) {
      await this._startWebRTC(false);
    }

    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this._send({ type: 'answer', sdp: this.pc.localDescription });
    } catch (err) {
      this._emit('error', { type: 'webrtc', message: 'Failed to handle offer', error: err });
    }
  }

  async _handleAnswer(data) {
    if (!this.pc) return;
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } catch (err) {
      this._emit('error', { type: 'webrtc', message: 'Failed to handle answer', error: err });
    }
  }

  async _handleIceCandidate(data) {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
      if (this.pc?.connectionState !== 'connected') {
        this._emit('error', { type: 'webrtc', message: 'Failed to add ICE candidate' });
      }
    }
  }

  _cleanupPeerConnection() {
    this._stopStatsMonitoring();

    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.remoteStream = null;
    this.isInitiator = false;
    this._connectionQuality = 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════
  //  CONNECTION QUALITY MONITORING
  // ═══════════════════════════════════════════════════════════════

  _startStatsMonitoring() {
    this._stopStatsMonitoring();

    this._lastBytesReceived = 0;

    this._statsTimer = setInterval(async () => {
      if (!this.pc) return;

      try {
        const stats = await this.pc.getStats();
        let totalBytesReceived = 0;
        let packetsLost = 0;
        let packetsReceived = 0;
        let roundTripTime = 0;
        let jitter = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            totalBytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
            jitter = report.jitter || 0;
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime = report.currentRoundTripTime || 0;
          }
        });

        // Calculate bitrate (kbps)
        const bytesDelta = totalBytesReceived - this._lastBytesReceived;
        const bitrate = (bytesDelta * 8) / (this.options.statsInterval / 1000) / 1000;
        this._lastBytesReceived = totalBytesReceived;

        // Calculate packet loss percentage
        const totalPackets = packetsReceived + packetsLost;
        const lossPercent = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

        // Determine quality level
        let quality = 'excellent';
        if (bitrate < this.options.lowQualityThreshold || lossPercent > 10 || roundTripTime > 0.5) {
          quality = 'critical';
        } else if (bitrate < 200 || lossPercent > 5 || roundTripTime > 0.3) {
          quality = 'poor';
        } else if (bitrate < 500 || lossPercent > 2 || roundTripTime > 0.15) {
          quality = 'good';
        }

        const prevQuality = this._connectionQuality;
        this._connectionQuality = quality;

        const qualityData = {
          quality,
          bitrate: Math.round(bitrate),
          packetLoss: lossPercent.toFixed(1),
          roundTripTime: (roundTripTime * 1000).toFixed(0),
          jitter: (jitter * 1000).toFixed(1),
        };

        this._emit('qualityUpdate', qualityData);

        // Adaptive quality: degrade video if connection is poor
        if (quality !== prevQuality) {
          this._emit('qualityChanged', { from: prevQuality, to: quality });
          this._adaptVideoQuality(quality);
        }
      } catch (e) {
        // Stats collection failed — not critical
      }
    }, this.options.statsInterval);
  }

  _stopStatsMonitoring() {
    if (this._statsTimer) {
      clearInterval(this._statsTimer);
      this._statsTimer = null;
    }
  }

  /**
   * Dynamically adjust video quality based on connection
   */
  _adaptVideoQuality(quality) {
    if (!this.pc) return;

    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (!sender) return;

    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) return;

      switch (quality) {
        case 'excellent':
          params.encodings[0].maxBitrate = 1500000;
          params.encodings[0].maxFramerate = 30;
          break;
        case 'good':
          params.encodings[0].maxBitrate = 800000;
          params.encodings[0].maxFramerate = 24;
          break;
        case 'poor':
          params.encodings[0].maxBitrate = 300000;
          params.encodings[0].maxFramerate = 15;
          break;
        case 'critical':
          params.encodings[0].maxBitrate = 100000;
          params.encodings[0].maxFramerate = 10;
          break;
      }

      sender.setParameters(params).catch(() => { });
    } catch (e) {
      // Encoding param adjustment not supported
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════

  _send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  getState() {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      userId: this.userId,
      roomCode: this.roomCode,
      inCall: this.pc?.connectionState === 'connected',
      connectionQuality: this._connectionQuality,
      audioMuted: this.localStream ? !this.localStream.getAudioTracks()[0]?.enabled : false,
      videoOff: this.localStream ? !this.localStream.getVideoTracks()[0]?.enabled : false,
      isBackgrounded: this._isBackgrounded,
    };
  }
}

export default VideoCallClient;

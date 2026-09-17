// @ts-nocheck
/**
 * VideoCallClient — Production Grade WebRTC Client for GiniVibe
 *
 * WebRTC + WebSocket signaling client.
 * Handles:
 * - Camera/Microphone access (getUserMedia)
 * - RTCPeerConnection offer/answer negotiation
 * - ICE candidate exchange & restart
 * - Remote and local stream emission
 * - Audio & video track toggles
 * - Adaptive bitrate & quality monitoring
 */

class VideoCallClient {
  public serverUrl: string;
  public options: any;
  public ws: any;
  public pc: any;
  public localStream: any;
  public remoteStream: any;
  public userId: any;
  public roomCode: any;
  public iceServers: any[];
  public isInitiator: boolean;

  constructor(serverUrl: string, options: any = {}) {
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
    this._hasEndedCall = false;
    this._statsTimer = null;
    this._lastBytesReceived = 0;
    this._connectionQuality = 'unknown';

    this._isBackgrounded = false;
    this._visibilityHandler = null;
    this._connectionHandler = null;
    this._onlineHandler = null;
    this._offlineHandler = null;
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
      const callbacks = [...this._listeners[event]];
      callbacks.forEach((cb) => {
        try { cb(...args); } catch (e) { console.error(`Event handler error [${event}]:`, e); }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  MOBILE & BROWSER HANDLERS
  // ═══════════════════════════════════════════════════════════════

  _setupMobileHandlers() {
    if (typeof document === 'undefined') return;

    this._visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this._isBackgrounded = true;
        this._emit('backgrounded');
        this._stopStatsMonitoring();
      } else {
        this._isBackgrounded = false;
        this._emit('foregrounded');
        if (this.ws && this.ws.readyState !== WebSocket.OPEN && !this._intentionalClose && !this._hasEndedCall) {
          this._attemptReconnect();
        }
        if (this.pc && this.pc.connectionState === 'connected') {
          this._startStatsMonitoring();
        }
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      this._connectionHandler = () => {
        this._emit('networkChanged', {
          type: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
        });

        if (this.pc && this.roomCode && !this._hasEndedCall) {
          this._attemptIceRestart();
        }
      };
      (navigator as any).connection.addEventListener('change', this._connectionHandler);
    }

    if (typeof window !== 'undefined') {
      this._onlineHandler = () => {
        this._emit('networkOnline');
        if (this.ws && this.ws.readyState !== WebSocket.OPEN && !this._intentionalClose && !this._hasEndedCall) {
          this._attemptReconnect();
        }
      };

      this._offlineHandler = () => {
        this._emit('networkOffline');
      };

      window.addEventListener('online', this._onlineHandler);
      window.addEventListener('offline', this._offlineHandler);
    }
  }

  _removeMobileHandlers() {
    if (typeof document !== 'undefined' && this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (typeof navigator !== 'undefined' && (navigator as any).connection && this._connectionHandler) {
      (navigator as any).connection.removeEventListener('change', this._connectionHandler);
      this._connectionHandler = null;
    }
    if (typeof window !== 'undefined') {
      if (this._onlineHandler) {
        window.removeEventListener('online', this._onlineHandler);
        this._onlineHandler = null;
      }
      if (this._offlineHandler) {
        window.removeEventListener('offline', this._offlineHandler);
        this._offlineHandler = null;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  INITIALIZE & MEDIA
  // ═══════════════════════════════════════════════════════════════

  async start(constraints?: any) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('[VideoCallClient] getUserMedia is not supported in this environment');
      return null;
    }

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
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }
      this.localStream = stream;
      this._emit('localStream', this.localStream);
      return this.localStream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (this._intentionalClose) {
            stream.getTracks().forEach((t) => t.stop());
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

  connect() {
    return new Promise((resolve, reject) => {
      if (typeof WebSocket === 'undefined') {
        return reject(new Error('WebSocket not supported in this environment'));
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(undefined);
        return;
      }

      this._intentionalClose = false;

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
          reject(new Error('Connection timeout to signaling server'));
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
          resolve(undefined);
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
      };
    });
  }

  _attemptReconnect() {
    if (this._reconnectAttempts >= this.options.reconnectMaxAttempts) {
      this._emit('error', { type: 'reconnect', message: 'Max reconnection attempts reached. Please refresh.' });
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this._reconnectAttempts - 1),
      30000
    );

    this._emit('reconnecting', { attempt: this._reconnectAttempts, delay });

    setTimeout(() => {
      if (this._intentionalClose) return;

      this.connect()
        .then(() => {
          if (this.roomCode) {
            this._send({ type: 'join-room', roomCode: this.roomCode });
          }
        })
        .catch(() => {});
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
    const code = String(roomCode || '').toUpperCase().trim();
    this.roomCode = code;
    this._send({ type: 'join-room', roomCode: code });
  }

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
        newStream.getTracks().forEach((t) => t.stop());
        return;
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      videoTrack.stop();

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
    if (this._hasEndedCall) return;
    this._hasEndedCall = true;

    try {
      this._send({ type: 'end-call' });
    } catch (e) {}

    this._cleanupPeerConnection();
    this.roomCode = null;
    this._emit('callEnded', { reason: 'user' });
  }

  disconnect() {
    this._intentionalClose = true;
    this._hasEndedCall = true;
    this._stopStatsMonitoring();
    this._removeMobileHandlers();
    this._cleanupPeerConnection();

    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      this.localStream = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, 'Client disconnect');
        }
      } catch (e) {}
      this.ws = null;
    }

    this._listeners = {};
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
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('[VideoCallClient] RTCPeerConnection not supported in this environment');
      return;
    }

    this.pc = new RTCPeerConnection(config);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });
    }

    this._configureVideoEncoding();

    // Handle remote tracks
    this.remoteStream = null;
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        if (event.track) {
          this.remoteStream.addTrack(event.track);
        }
      }
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

      params.encodings[0].maxBitrate = 1500000;
      params.encodings[0].maxFramerate = 30;

      videoSender.setParameters(params).catch(() => {});
    } catch (e) {}
  }

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

        const bytesDelta = totalBytesReceived - this._lastBytesReceived;
        const bitrate = (bytesDelta * 8) / (this.options.statsInterval / 1000) / 1000;
        this._lastBytesReceived = totalBytesReceived;

        const totalPackets = packetsReceived + packetsLost;
        const lossPercent = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

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
      } catch (e) {}
    }, this.options.statsInterval);
  }

  _stopStatsMonitoring() {
    if (this._statsTimer) {
      clearInterval(this._statsTimer);
      this._statsTimer = null;
    }
  }

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

export { VideoCallClient };
export default VideoCallClient;

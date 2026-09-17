import { SignalingMessage, IceServerConfig, LiveCallState } from '../types';

type EventListener = (...args: any[]) => void;

export class LiveVideoClient {
  private serverUrl: string;
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceServers: IceServerConfig[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  private listeners: Record<string, EventListener[]> = {};
  public state: LiveCallState = 'IDLE';
  public roomCode: string | null = null;
  public isInitiator: boolean = false;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || this.getDefaultServerUrl();
  }

  private getDefaultServerUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      return `${protocol}//${hostname}:8080`;
    }
    return 'ws://localhost:8080';
  }

  public on(event: string, callback: EventListener): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  public off(event: string, callback: EventListener): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
    return this;
  }

  private emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[LiveVideoClient] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  private setState(newState: LiveCallState): void {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  public async startMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      if (this.localStream) {
        return this.localStream;
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.emit('localStream', stream);
      return stream;
    } catch (err: any) {
      console.error('[LiveVideoClient] Failed to acquire user media:', err);
      this.emit('error', 'Camera or microphone access was denied.');
      throw err;
    }
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return resolve();
      }

      try {
        this.ws = new WebSocket(this.serverUrl);
      } catch (err) {
        return reject(err);
      }

      this.ws.onopen = () => {
        console.log('[LiveVideoClient] Connected to signaling server:', this.serverUrl);
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          await this.handleSignalingMessage(msg);
        } catch (err) {
          console.error('[LiveVideoClient] Error processing signaling message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[LiveVideoClient] WebSocket error:', err);
        this.emit('error', 'Signaling connection error. Please ensure server at port 8080 is running.');
      };

      this.ws.onclose = () => {
        console.log('[LiveVideoClient] WebSocket closed');
        this.emit('disconnected');
        if (this.state === 'IN_CALL' || this.state === 'CONNECTING') {
          this.setState('DISCONNECTED');
        }
      };
    });
  }

  private send(msg: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[LiveVideoClient] Cannot send message, WebSocket not open');
    }
  }

  private async createPeerConnection(): Promise<RTCPeerConnection> {
    if (this.pc) {
      this.pc.close();
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.pc = pc;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.ontrack = (event) => {
      console.log('[LiveVideoClient] Remote track received:', event.streams[0]);
      this.remoteStream = event.streams[0];
      this.emit('remoteStream', event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({ type: 'ice-candidate', candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[LiveVideoClient] ICE Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        this.setState('IN_CALL');
        this.emit('callStarted');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.setState('DISCONNECTED');
        this.emit('peerDisconnected', 'Connection lost');
      }
    };

    return pc;
  }

  private async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
    switch (msg.type) {
      case 'welcome':
        if (msg.iceServers && msg.iceServers.length > 0) {
          this.iceServers = msg.iceServers;
        }
        break;

      case 'queue-joined':
        this.setState('SEARCHING');
        this.emit('queueJoined', msg.position);
        break;

      case 'matched':
        this.roomCode = msg.roomCode || null;
        this.isInitiator = !!msg.isInitiator;
        this.setState('CONNECTING');
        this.emit('matched', { roomCode: this.roomCode, isInitiator: this.isInitiator });

        const pc = await this.createPeerConnection();
        if (this.isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          this.send({ type: 'offer', sdp: offer });
        }
        break;

      case 'room-created':
      case 'room-joined':
        this.roomCode = msg.roomCode || null;
        this.emit(msg.type, msg.roomCode);
        break;

      case 'offer':
        if (!this.pc) {
          await this.createPeerConnection();
        }
        if (this.pc && msg.sdp) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.send({ type: 'answer', sdp: answer });
        }
        break;

      case 'answer':
        if (this.pc && msg.sdp) {
          await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        }
        break;

      case 'ice-candidate':
        if (this.pc && msg.candidate) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            console.warn('[LiveVideoClient] Error adding ICE candidate:', e);
          }
        }
        break;

      case 'peer-disconnected':
      case 'call-ended':
        this.handleCallEnd(msg.reason || 'Call ended');
        break;

      case 'error':
        this.emit('error', msg.message || 'Unknown signaling error');
        break;
    }
  }

  public joinQueue(): void {
    this.send({ type: 'join-queue' });
    this.setState('SEARCHING');
  }

  public leaveQueue(): void {
    this.send({ type: 'leave-queue' });
    this.setState('IDLE');
  }

  public createRoom(): void {
    this.send({ type: 'create-room' });
  }

  public joinRoom(roomCode: string): void {
    this.roomCode = roomCode;
    this.send({ type: 'join-room', roomCode });
  }

  public toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
      this.send({ type: 'toggle-audio', enabled });
    }
  }

  public toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
      this.send({ type: 'toggle-video', enabled });
    }
  }

  public endCall(): void {
    this.send({ type: 'end-call' });
    this.handleCallEnd('User ended call');
  }

  private handleCallEnd(reason: string): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.remoteStream = null;
    this.roomCode = null;
    this.setState('IDLE');
    this.emit('callEnded', reason);
  }

  public disconnect(): void {
    this.endCall();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
    this.setState('IDLE');
  }
}

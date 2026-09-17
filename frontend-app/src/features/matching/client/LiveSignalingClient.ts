import { getSignalingUrl } from '../api/matchingApi';
import { LiveCallState } from '../types';

type EventListener = (...args: any[]) => void;

export interface SignalingMessage {
  type: string;
  roomCode?: string;
  isInitiator?: boolean;
  position?: number;
  message?: string;
  reason?: string;
  enabled?: boolean;
  iceServers?: Array<{ urls: string | string[] }>;
  candidate?: any;
  sdp?: any;
}

export class LiveSignalingClient {
  private serverUrl: string;
  private ws: WebSocket | null = null;
  private listeners: Record<string, EventListener[]> = {};
  public state: LiveCallState = 'IDLE';
  public roomCode: string | null = null;
  public isInitiator: boolean = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private intentionalClose = false;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || getSignalingUrl();
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
          console.warn(`[LiveSignalingClient] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  public setState(newState: LiveCallState): void {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  public connect(authToken?: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return resolve();
      }

      this.intentionalClose = false;

      let url = this.serverUrl;
      if (authToken) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}token=${encodeURIComponent(authToken)}`;
      }

      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('Signaling connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          this.handleSignalingMessage(msg);
        } catch (err) {
          console.warn('[LiveSignalingClient] Parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        this.emit('error', 'Signaling server connection error');
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this.emit('disconnected', { code: event.code, reason: event.reason });

        if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
          setTimeout(() => {
            if (!this.intentionalClose) {
              this.connect(authToken).catch(() => {});
            }
          }, delay);
        } else if (this.state === 'IN_CALL' || this.state === 'CONNECTING') {
          this.setState('DISCONNECTED');
        }
      };
    });
  }

  private send(msg: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[LiveSignalingClient] Cannot send message, WebSocket is not open');
    }
  }

  private handleSignalingMessage(msg: SignalingMessage): void {
    switch (msg.type) {
      case 'welcome':
        this.emit('welcome', msg);
        break;

      case 'queue-joined':
        this.setState('SEARCHING');
        this.emit('queueJoined', msg.position);
        break;

      case 'matched':
        this.roomCode = msg.roomCode || null;
        this.isInitiator = !!msg.isInitiator;
        this.setState('IN_CALL');
        this.emit('matched', { roomCode: this.roomCode, isInitiator: this.isInitiator });
        break;

      case 'room-created':
      case 'room-joined':
        this.roomCode = msg.roomCode || null;
        this.setState('IN_CALL');
        this.emit(msg.type, msg.roomCode);
        break;

      case 'peer-disconnected':
      case 'call-ended':
        this.handleCallEnd(msg.reason || 'Call ended by peer');
        break;

      case 'error':
        this.emit('error', msg.message || 'Signaling error');
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
    this.roomCode = roomCode.toUpperCase().trim();
    this.send({ type: 'join-room', roomCode: this.roomCode });
  }

  public toggleAudio(enabled: boolean): void {
    this.send({ type: 'toggle-audio', enabled });
  }

  public toggleVideo(enabled: boolean): void {
    this.send({ type: 'toggle-video', enabled });
  }

  public endCall(): void {
    this.send({ type: 'end-call' });
    this.handleCallEnd('User ended call');
  }

  private handleCallEnd(reason: string): void {
    this.roomCode = null;
    this.setState('ENDED');
    this.emit('callEnded', reason);
  }

  public disconnect(): void {
    this.intentionalClose = true;
    this.endCall();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = {};
    this.setState('IDLE');
  }
}

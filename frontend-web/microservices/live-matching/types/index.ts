export type LiveCallState = 'IDLE' | 'SEARCHING' | 'CONNECTING' | 'IN_CALL' | 'DISCONNECTED';

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface SignalingMessage {
  type:
    | 'join-queue'
    | 'leave-queue'
    | 'create-room'
    | 'join-room'
    | 'welcome'
    | 'matched'
    | 'room-created'
    | 'room-joined'
    | 'queue-joined'
    | 'offer'
    | 'answer'
    | 'ice-candidate'
    | 'peer-disconnected'
    | 'call-ended'
    | 'end-call'
    | 'toggle-audio'
    | 'toggle-video'
    | 'error';
  roomCode?: string;
  userId?: string;
  isInitiator?: boolean;
  position?: number;
  sdp?: any;
  candidate?: any;
  reason?: string;
  message?: string;
  iceServers?: IceServerConfig[];
  enabled?: boolean;
}

export interface MediaDeviceState {
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

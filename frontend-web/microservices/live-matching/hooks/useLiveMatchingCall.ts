'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveVideoClient } from '../client/LiveVideoClient';
import { LiveCallState } from '../types';

export function useLiveMatchingCall(autoInitMedia: boolean = false) {
  const clientRef = useRef<LiveVideoClient | null>(null);
  const [callState, setCallState] = useState<LiveCallState>('IDLE');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;

    const client = new LiveVideoClient();
    clientRef.current = client;

    client
      .on('stateChange', (state: LiveCallState) => setCallState(state))
      .on('localStream', (stream: MediaStream) => setLocalStream(stream))
      .on('remoteStream', (stream: MediaStream) => setRemoteStream(stream))
      .on('queueJoined', (pos: number) => setQueuePosition(pos))
      .on('room-created', (code: string) => setRoomCode(code))
      .on('room-joined', (code: string) => setRoomCode(code))
      .on('matched', ({ roomCode: code }) => setRoomCode(code))
      .on('callEnded', () => {
        setRemoteStream(null);
        setQueuePosition(null);
      })
      .on('error', (msg: string) => setError(msg));

    try {
      if (autoInitMedia) {
        await client.startMedia();
      }
      await client.connect();
    } catch (err: any) {
      console.warn('[useLiveMatchingCall] Connection or media init issue:', err);
    }

    return client;
  }, [autoInitMedia]);

  useEffect(() => {
    initClient();

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [initClient]);

  const startMedia = async () => {
    if (!clientRef.current) await initClient();
    try {
      return await clientRef.current?.startMedia();
    } catch (e: any) {
      setError('Could not activate camera/microphone. Please allow browser permissions.');
      throw e;
    }
  };

  const joinQueue = async () => {
    setError(null);
    if (!localStream) {
      await startMedia();
    }
    clientRef.current?.joinQueue();
  };

  const leaveQueue = () => {
    clientRef.current?.leaveQueue();
    setQueuePosition(null);
  };

  const createRoom = async () => {
    setError(null);
    if (!localStream) {
      await startMedia();
    }
    clientRef.current?.createRoom();
  };

  const joinRoom = async (code: string) => {
    setError(null);
    if (!localStream) {
      await startMedia();
    }
    clientRef.current?.joinRoom(code);
  };

  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    clientRef.current?.toggleAudio(!nextState);
  };

  const toggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    clientRef.current?.toggleVideo(!nextState);
  };

  const endCall = () => {
    clientRef.current?.endCall();
  };

  return {
    client: clientRef.current,
    callState,
    localStream,
    remoteStream,
    roomCode,
    queuePosition,
    isAudioMuted,
    isVideoOff,
    error,
    startMedia,
    joinQueue,
    leaveQueue,
    createRoom,
    joinRoom,
    toggleAudio,
    toggleVideo,
    endCall,
    setError,
  };
}

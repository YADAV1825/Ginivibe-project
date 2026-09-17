'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from 'lucide-react';

interface CallControlsProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  roomCode?: string | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isAudioMuted,
  isVideoOff,
  roomCode,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="glass"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: '12px 24px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Audio Mute/Unmute */}
      <button
        onClick={onToggleAudio}
        title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          backgroundColor: isAudioMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Video On/Off */}
      <button
        onClick={onToggleVideo}
        title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          backgroundColor: isVideoOff ? '#ef4444' : 'rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
      </button>

      {/* Copy Room Code (if code exists) */}
      {roomCode && (
        <button
          onClick={handleCopyCode}
          title="Copy Room Link/Code"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: copied ? '#22c55e' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      )}

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        title="End Call"
        style={{
          width: '54px',
          height: '54px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.5)',
          transition: 'transform 0.2s ease',
        }}
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

'use client';

import React from 'react';
import { Radio, X } from 'lucide-react';

interface MatchRadarModalProps {
  isOpen: boolean;
  queuePosition: number | null;
  onCancel: () => void;
}

export const MatchRadarModal: React.FC<MatchRadarModalProps> = ({
  isOpen,
  queuePosition,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
        }}
      >
        {/* Radar Animation Container */}
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Ripple */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-full)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          {/* Middle Ripple */}
          <div
            style={{
              position: 'absolute',
              inset: '18px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          {/* Center Core */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.6)',
              zIndex: 2,
            }}
          >
            <Radio size={30} />
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Finding a Live Match...
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
          Connecting you with someone ready to video call in real time via our low-latency signaling engine.
        </p>

        {queuePosition !== null && (
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: 'var(--space-6)',
            }}
          >
            Queue Position: #{queuePosition}
          </div>
        )}

        <div>
          <button
            onClick={onCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <X size={16} />
            <span>Cancel Discovery</span>
          </button>
        </div>
      </div>
    </div>
  );
};

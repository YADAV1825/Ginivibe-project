'use client';

import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { CandidateProfile } from '../types';

interface FollowModalProps {
  isOpen: boolean;
  candidate: CandidateProfile | null;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  loading?: boolean;
}

export const FollowModal: React.FC<FollowModalProps> = ({
  isOpen,
  candidate,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [message, setMessage] = useState('');

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(message);
    setMessage('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '460px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--space-6)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                border: '2px solid var(--color-accent)',
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Send Message Request to {candidate.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                They will see your request and message in their Messages inbox.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 'var(--space-1)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Introductory Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${candidate.name}! Saw we matched and wanted to connect...`}
              rows={3}
              required
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !message.trim() ? 0.7 : 1,
              }}
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Message Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

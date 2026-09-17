'use client';

import React from 'react';
import { Sparkles, Heart, X, MessageSquare, Video, ShieldCheck } from 'lucide-react';
import { CandidateProfile, CandidateScore } from '../types';

interface CandidateCardProps {
  candidate: CandidateProfile;
  matchScore?: CandidateScore | null;
  onPass: () => void;
  onFollow: () => void;
  onVideoCall?: (candidateId: string) => void;
  onMessage?: (candidateId: string) => void;
  actionLoading?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  matchScore,
  onPass,
  onFollow,
  onVideoCall,
  onMessage,
  actionLoading = false,
}) => {
  const scorePercent = matchScore?.score ? Math.round(matchScore.score * 100) : 88;
  const [imgOk, setImgOk] = React.useState(true);
  React.useEffect(() => {
    setImgOk(true);
  }, [candidate.avatarUrl]);
  const avatarSrc = typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl.trim() : '';

  return (
    <div
      className="glass"
      style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
      }}
    >
      {/* Hero Image / Avatar */}
      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(182,255,46,0.25), rgba(0,0,0,0.08))' }}>
        {avatarSrc && imgOk ? (
          <img
            src={avatarSrc}
            alt={candidate.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgOk(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            {(candidate.name || 'G').charAt(0).toUpperCase()}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 40%, transparent 80%)',
          }}
        />

        {/* Compatibility Score Pill */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Sparkles size={16} />
          <span>{scorePercent}% Match</span>
        </div>

        {/* Quality Match Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} color="#ec4899" />
          <span>Top Pick</span>
        </div>

        {/* Name and Age Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '20px',
            right: '20px',
            color: '#ffffff',
          }}
        >
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            {candidate.name}, <span style={{ fontWeight: 400, opacity: 0.9 }}>{candidate.age}</span>
          </h2>
          {candidate.location && (
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '4px' }}>
              📍 {candidate.location}
            </p>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div style={{ padding: 'var(--space-5)' }}>
        {/* Bio */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-4)',
          }}
        >
          {candidate.bio}
        </p>

        {/* Interest & Astrological Tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {candidate.tags && candidate.tags.length > 0 ? (
            candidate.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span
              style={{
                fontSize: '0.8rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
              }}
            >
              #Matching
            </span>
          )}
        </div>

        {/* Primary Matching Action Controls (Skip vs Send Friend Request) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Skip Button */}
          <button
            onClick={onPass}
            disabled={actionLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={18} />
            <span>Skip</span>
          </button>

          {/* Send Friend Request Button */}
          <button
            onClick={onFollow}
            disabled={actionLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Heart size={18} fill="#ffffff" />
            <span>Send Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};

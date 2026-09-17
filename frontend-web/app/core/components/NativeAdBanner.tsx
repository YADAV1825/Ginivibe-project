'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAdServer } from '../hooks/useAdServer';

interface NativeAdBannerProps {
  placement: 'FEED' | 'EXPLORE' | 'MATCHING';
  currentUser?: any;
  /** Fires once the ad request settles with no renderable ad. */
  onEmpty?: () => void;
}

export const NativeAdBanner: React.FC<NativeAdBannerProps> = ({ placement, currentUser, onEmpty }) => {
  const { adData, trackClick, settled } = useAdServer(placement, currentUser);
  const [mediaFailed, setMediaFailed] = React.useState(false);

  React.useEffect(() => {
    setMediaFailed(false);
  }, [adData?.adId, adData?.creative?.mediaUrl]);

  React.useEffect(() => {
    if (settled && !adData) onEmpty?.();
  }, [settled, adData, onEmpty]);

  if (!adData) {
    return null; // Silent failure/passthrough when no ad is eligible
  }

  const { creative } = adData;
  const mediaUrl = typeof creative?.mediaUrl === 'string' ? creative.mediaUrl.trim() : '';

  // No media URL at all: nothing renderable.
  if (!mediaUrl) {
    return null;
  }

  const handleAdClick = () => {
    trackClick();
    if (creative.destinationUrl) {
      window.open(creative.destinationUrl, '_blank');
    }
  };

  return (
    <div 
      onClick={handleAdClick}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        marginBottom: 'var(--space-6)',
        transition: 'transform 0.2s ease'
      }}
      className="ad-banner-hover"
    >
      <span style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'white',
        fontSize: '0.65rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '4px',
        zIndex: 10,
        backdropFilter: 'blur(4px)'
      }}>
        Sponsored
      </span>

      {mediaFailed ? (
        <div
          role="img"
          aria-label={creative.headline || 'Advertisement'}
          style={{
            width: '100%',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #23262f 0%, #3a2b5c 55%, #4d7c0f 130%)',
            color: '#f8e7c9',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          <Sparkles size={30} color="#b6ff2e" aria-hidden="true" />
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
            {creative.headline || 'Sponsored'}
          </span>
        </div>
      ) : creative.type === 'IMAGE' ? (
        <img 
          src={creative.mediaUrl} 
          alt={creative.headline || 'Advertisement'} 
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setMediaFailed(true)}
        />
      ) : (
        <video 
          src={creative.mediaUrl} 
          autoPlay loop muted playsInline
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
          onError={() => setMediaFailed(true)}
        />
      )}

      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-elevated)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-1)', color: 'var(--color-text-primary)' }}>
          {creative.headline}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          {creative.description}
        </p>
        <button style={{
          width: '100%',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          padding: '8px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer'
        }}>
          {creative.cta || 'Learn More'}
        </button>
      </div>
    </div>
  );
};

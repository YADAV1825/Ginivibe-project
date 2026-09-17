'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Sparkles, Brain, Smile, RefreshCw, AlertCircle, Compass } from 'lucide-react';
import { useNonLiveMatching } from '../hooks/useNonLiveMatching';
import { CandidateCard } from '../components/CandidateCard';
import { FollowModal } from '../components/FollowModal';

const CATEGORIES = [
  {
    id: 'personalized',
    title: 'Personalized Match',
    icon: Users,
    description: 'Algorithmic compatibility matching from your profile & preferences',
    color: '#6366f1',
  },
  {
    id: 'field',
    title: 'Field & Hobbies',
    icon: Sparkles,
    description: 'Connect with peers in tech, arts, gaming, and sports',
    color: '#22c55e',
  },
  {
    id: 'personality',
    title: 'MBTI & Personality',
    icon: Brain,
    description: 'Psychological and personality type compatibility scoring',
    color: '#f59e0b',
  },
  {
    id: 'mood',
    title: 'Mood & Vibe',
    icon: Smile,
    description: 'Find someone matching your current discovery mood',
    color: '#ec4899',
  },
];

export function NonLiveMatchingView() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('personalized');
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

  const {
    candidate,
    matchScore,
    loading,
    actionLoading,
    error,
    isServiceOffline,
    emptyState,
    fetchNextCandidate,
    passCandidate,
    followCandidate,
  } = useNonLiveMatching();

  const handleVideoCall = (candidateId: string) => {
    // Generate an instant room code and redirect to live video call
    const instantRoomCode = `GV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    router.push(`/video-call?roomCode=${instantRoomCode}&target=${candidateId}`);
  };

  const handleMessage = (candidateId: string) => {
    router.push(`/messages?userId=${candidateId}`);
  };

  const handleFollowSubmit = async (message: string) => {
    await followCandidate(message);
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #a855f7 100%)',
              color: '#ffffff',
            }}
          >
            <Compass size={24} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
            Discovery & Matching Hub
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
          Powered by the GiniVibe Non-Live Algorithmic Matching Microservice (Port 3003).
        </p>
      </header>

      {/* Microservice Offline Alert (Non-blocking) */}
      {isServiceOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#b45309',
            marginBottom: 'var(--space-6)',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <div>
            <strong>Matching Microservice Notice:</strong> The backend at port 3003 is currently offline or warming up.
            You can verify the backend with <code>cd backend/microservices/non-live-matching && npm run dev</code>.
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? `2px solid ${category.color}` : '1px solid var(--color-border)',
                backgroundColor: isSelected ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: category.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {category.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                >
                  {category.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Candidate Card or States */}
      <div style={{ minHeight: '480px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--color-border)',
                borderTopColor: 'var(--color-accent)',
                borderRadius: 'var(--radius-full)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto var(--space-4)',
              }}
            />
            <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Computing compatibility and next candidate...
            </p>
          </div>
        ) : emptyState || !candidate ? (
          <div
            className="glass"
            style={{
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-xl)',
              textAlign: 'center',
              maxWidth: '440px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
                color: 'var(--color-accent)',
              }}
            >
              <Compass size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              You've seen all current matches!
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
              Check back soon as new members register, or re-run the discovery loop.
            </p>
            <button
              onClick={() => fetchNextCandidate()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh Candidates</span>
            </button>
          </div>
        ) : (
          <CandidateCard
            candidate={candidate}
            matchScore={matchScore}
            onPass={passCandidate}
            onFollow={() => setIsFollowModalOpen(true)}
            onVideoCall={handleVideoCall}
            onMessage={handleMessage}
            actionLoading={actionLoading}
          />
        )}
      </div>

      {/* Follow / Connect Modal */}
      <FollowModal
        isOpen={isFollowModalOpen}
        candidate={candidate}
        onClose={() => setIsFollowModalOpen(false)}
        onSubmit={handleFollowSubmit}
        loading={actionLoading}
      />
    </div>
  );
}

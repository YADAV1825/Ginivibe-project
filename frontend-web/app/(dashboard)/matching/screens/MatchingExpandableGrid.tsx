'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ChevronRight, Users, Video } from 'lucide-react';

export type MatchingMode = 'live' | 'non-live';

interface MatchingOption {
  id: string;
  tag: string;
  title: string;
  description: string;
  blurb: string[];
  bgText: string;
  panel: string;
}

const OPTIONS: MatchingOption[] = [
  {
    id: 'personalized',
    tag: 'Profile',
    title: 'Personalized Matching',
    description: 'Based on your overall profile and preferences',
    blurb: [
      'Scores every profile against your age, interests and intent.',
      'Learns from every skip and follow — sharper each visit.',
      'Best first stop if you are new to GiniVibe.',
    ],
    bgText: 'FOR YOU',
    panel: 'linear-gradient(135deg, #d9f873 0%, #f8e7c9 100%)',
  },
  {
    id: 'astrology',
    tag: 'Kundli',
    title: 'Astrology Matching',
    description: 'Vedic kundli compatibility — signs, gunas and doshas',
    blurb: [
      'Moon signs and guna Milan scored the traditional way.',
      'Mangal dosha and deal-breakers flagged up front.',
      'Pairs with your D1 chart insight on the astrology tab.',
    ],
    bgText: 'COSMIC',
    panel: 'linear-gradient(135deg, #e7dcf6 0%, #f8e7c9 100%)',
  },
  {
    id: 'custom',
    tag: 'Custom',
    title: 'Customized Matching',
    description: 'Your rules: age, field, interests, distance',
    blurb: [
      'Hard filters you control — nothing outside your lines.',
      'Mix field, habits and interests into one custom blend.',
      'Tune it anytime; the next candidate follows the new rules.',
    ],
    bgText: 'CUSTOM',
    panel: 'linear-gradient(135deg, #f3e2c9 0%, #fbefd4 100%)',
  },
  {
    id: 'ai',
    tag: 'AI',
    title: 'AI Matching',
    description: 'Describe who you want to meet. The AI finds them.',
    blurb: [
      'Type what you are looking for in plain words.',
      'Gini AI reads intent — vibe, values, energy — not keywords.',
      'Attach your intent as the icebreaker on requests.',
    ],
    bgText: 'VIBE AI',
    panel: 'linear-gradient(135deg, #b6ff2e 0%, #e7dcf6 100%)',
  },
];

interface MatchingExpandableGridProps {
  aiIntent: string;
  onAiIntentChange: (value: string) => void;
  onPick: (categoryId: string, mode: MatchingMode) => void;
}

export function MatchingExpandableGrid({ aiIntent, onAiIntentChange, onPick }: MatchingExpandableGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const selected = OPTIONS.find((option) => option.id === selectedId) ?? null;

  const select = (id: string) => {
    // Toggle: clicking the active pill again deselects it.
    if (id === selectedId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    // On small screens the detail sits below the rail — bring it into view.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const choose = (mode: MatchingMode) => {
    if (!selected) return;
    onPick(selected.id, mode);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center lg:gap-14 lg:min-h-[52vh]">
        {/* Left rail: 4 slim pill buttons, nothing pre-selected */}
        <ul
          aria-label="Matching options"
          className="flex w-full max-w-[280px] flex-col gap-3"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {OPTIONS.map((option, index) => {
            const isActive = option.id === selectedId;
            return (
              <motion.li
                key={option.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  onClick={() => select(option.id)}
                  aria-pressed={isActive}
                  className="flex w-full items-center gap-3 text-left"
                  style={{
                    padding: '12px 12px 12px 20px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(182, 255, 46, 0.14)' : 'rgba(3, 3, 3, 0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: isActive
                      ? '1px solid rgba(182, 255, 46, 0.7)'
                      : '1px solid rgba(248, 231, 201, 0.18)',
                    boxShadow: isActive ? '0 8px 28px rgba(182, 255, 46, 0.14)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'rgba(182, 255, 46, 0.45)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'rgba(248, 231, 201, 0.18)';
                  }}
                >
                  <span
                    className="font-display min-w-0 flex-1"
                    style={{ color: isActive ? '#d9f873' : '#f8e7c9', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {option.title}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      background: isActive ? '#b6ff2e' : 'rgba(248, 231, 201, 0.12)',
                      color: isActive ? '#23262f' : '#f8e7c9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease',
                      transform: isActive ? 'rotate(90deg)' : 'none',
                    }}
                  >
                    <ChevronRight size={16} />
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* Right: detail card for the selected option */}
        <div ref={detailRef} className="w-full min-w-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.16 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full overflow-hidden sm:rounded-3xl"
              style={{ background: '#ffffff', border: '1px solid rgba(35,38,47,0.14)', color: '#23262f', boxShadow: '0 24px 64px -24px rgba(0, 0, 0, 0.55)' }}
            >
              <div className="relative h-40 shrink-0 overflow-hidden sm:rounded-t-3xl" style={{ background: selected.panel }}>
                <span
                  aria-hidden="true"
                  className="font-display absolute -bottom-4 right-2 select-none"
                  style={{ fontSize: '4rem', fontWeight: 900, color: 'rgba(35,38,47,0.12)', lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}
                >
                  {selected.bgText}
                </span>
                <span className="gv-chip absolute left-4 top-4">{selected.tag}</span>
              </div>

              <div className="flex flex-col p-5 sm:p-6">
                <h3
                  className="font-display"
                  style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#23262f', margin: 0 }}
                >
                  {selected.title}
                </h3>
                <p style={{ color: '#4b4f5c', margin: '4px 0 0' }}>
                  {selected.description}
                </p>

                <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.blurb.map((point) => (
                    <li key={point} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#23262f', fontSize: '0.92rem' }}>
                      <span aria-hidden="true" style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#4d7c0f', marginTop: '7px', flexShrink: 0 }} />
                      {point}
                    </li>
                  ))}
                </ul>

                {selected.id === 'ai' && (
                  <div style={{ marginTop: '16px' }}>
                    <label htmlFor="match-ai-intent" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#23262f' }}>
                      What are you looking for?
                    </label>
                    <input
                      id="match-ai-intent"
                      type="text"
                      value={aiIntent}
                      onChange={(event) => onAiIntentChange(event.target.value)}
                      placeholder="I want to connect with a founder in Delhi."
                      maxLength={120}
                      autoComplete="off"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#fffdf7', border: '1px solid rgba(35,38,47,0.16)', color: '#23262f', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => choose('live')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 12px', borderRadius: '14px', background: '#b6ff2e', color: '#23262f', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(35,38,47,0.18)' }}
                  >
                    <Video size={26} aria-hidden="true" />
                    Live Match
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.85 }}>Instant video connection</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => choose('non-live')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '16px 12px', borderRadius: '14px', background: '#fffdf7', color: '#23262f', border: '1px solid rgba(35,38,47,0.16)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
                  >
                    <Users size={26} aria-hidden="true" />
                    Browse First
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.7 }}>See profiles, then connect</span>
                  </button>
                </div>
              </div>
            </motion.div>
            ) : (
              <motion.p
                key="match-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4, delay: 0.25 }}
                style={{ color: 'rgba(248, 231, 201, 0.55)', fontSize: '1rem', margin: 0, padding: '24px 8px' }}
              >
                Pick one to see how it works.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

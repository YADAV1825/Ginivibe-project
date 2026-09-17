'use client';

import React from 'react';
import { Video, CalendarDays, Orbit, Bot } from 'lucide-react';
import { DeviceFrame } from './device-frame';
import { Reveal } from './reveal';

interface HeroProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const PROOF = [
  { icon: Video, text: 'Live video rooms with real people' },
  { icon: CalendarDays, text: 'Online gatherings and offline meetups' },
  { icon: Orbit, text: 'Vedic D1 and D9 charts for self understanding' },
  { icon: Bot, text: 'AI characters you can discover and chat with' },
];

export function Hero({ onOpenAuth }: HeroProps) {
  return (
    <section className="gv-hero" aria-labelledby="hero-heading">
      <div className="gv-wrap">
        <div className="gv-hero-panel">
          <div className="gv-hero-grid">
            <Reveal>
              <p className="gv-eyebrow">Social connection with intent</p>
              <h1 id="hero-heading" className="gv-display">
                Meet people like you <span className="accent">mean it.</span>
              </h1>
              <p className="gv-lead">
                GiniVibe is social connection with intent. AI matching, live
                rooms, real events, honest astrology, and AI characters.
              </p>
              <div className="gv-hero-cta">
                <button
                  type="button"
                  className="gv-btn gv-btn-primary gv-btn-lg"
                  onClick={() => onOpenAuth('register')}
                >
                  Get started
                </button>
                <a href="#matching" className="gv-btn gv-btn-ghost gv-btn-lg">
                  How matching works
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="gv-device-stage">
                <div className="gv-device-frame">
                  {/* Autoplay loop, muted, no controls — purely presentational. */}
                  <DeviceFrame videoSrc="/android-video.mp4" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofStrip() {
  return (
    <div className="gv-wrap">
      <Reveal>
        <div className="gv-strip">
          <ul>
            {PROOF.map((item) => (
              <li key={item.text}>
                <item.icon size={17} aria-hidden="true" />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

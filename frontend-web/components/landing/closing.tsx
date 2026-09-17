'use client';

import React from 'react';
import Link from 'next/link';
import { Reveal } from './reveal';

interface ClosingProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export function Closing({ onOpenAuth }: ClosingProps) {
  return (
    <>
      <section className="gv-manifesto" aria-label="Why GiniVibe exists">
        <div className="gv-wrap">
          <Reveal>
            <p>
              Most social apps optimize for your attention. GiniVibe optimizes
              for your <em>intentions</em>: who you want to meet, what you want
              to understand about yourself, and where you want to belong.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="gv-closing" aria-labelledby="closing-heading">
        <div className="gv-wrap">
          <div className="gv-closing-panel">
            <Reveal>
              <h2 id="closing-heading">Your people are already here.</h2>
              <p>
                Get started, tell the matcher what you are looking for,
                and join your first room tonight.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="gv-hero-cta" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className="gv-btn gv-btn-primary gv-btn-lg"
                  onClick={() => onOpenAuth('register')}
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="gv-btn gv-btn-ghost gv-btn-lg"
                  onClick={() => onOpenAuth('login')}
                >
                  Sign in
                </button>
              </div>
            </Reveal>
          </div>

          <footer className="gv-footer">
            <div className="gv-footer-grid">
              <div className="gv-footer-brand">
                <Link href="#top" className="gv-brand" aria-label="GiniVibe home">
                  <img src="/logo.jpeg" alt="GiniVibe logo" width={34} height={34} />
                  <span className="gv-brand-name">GiniVibe</span>
                </Link>
                <p>
                  A social network built around intention. AI matching, live
                  rooms, real-world events, self-knowledge through astrology,
                  and characters worth talking to.
                </p>
              </div>
              <nav className="gv-footer-col" aria-label="Meet">
                <h3>Meet</h3>
                <ul>
                  <li><Link href="/matching">AI matching</Link></li>
                  <li><Link href="/feed">Feed</Link></li>
                  <li><Link href="/rooms">Rooms</Link></li>
                  <li><Link href="/events">Events</Link></li>
                </ul>
              </nav>
              <nav className="gv-footer-col" aria-label="Explore">
                <h3>Explore</h3>
                <ul>
                  <li><Link href="/astrology">Astrology</Link></li>
                  <li><Link href="/gini_ai">Gini AI characters</Link></li>
                  <li><Link href="/messages">Messages</Link></li>
                  <li><Link href="/search">Search</Link></li>
                </ul>
              </nav>
              <nav className="gv-footer-col" aria-label="Get started">
                <h3>Get started</h3>
                <ul>
                  <li>
                    <button type="button" onClick={() => onOpenAuth('register')}>
                      Get started
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => onOpenAuth('login')}>
                      Sign in
                    </button>
                  </li>
                  <li><a href="#top">Watch the Android demo</a></li>
                </ul>
              </nav>
            </div>
            <div className="gv-footer-base">
              <span>© 2026 GiniVibe. All rights reserved.</span>
              <span>Meet people like you mean it.</span>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}

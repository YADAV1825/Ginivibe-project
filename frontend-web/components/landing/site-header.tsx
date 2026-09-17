'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface SiteHeaderProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const NAV = [
  { label: 'Matching', href: '#matching' },
  { label: 'Feed', href: '#feed' },
  { label: 'Events', href: '#events' },
  { label: 'Astrology', href: '#astrology' },
  { label: 'Rooms', href: '#rooms' },
  { label: 'Gini AI', href: '#gini-ai' },
];

export function SiteHeader({ onOpenAuth }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="gv-header">
      <div className="gv-wrap gv-header-inner">
        <a href="#top" className="gv-brand" aria-label="GiniVibe home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="GiniVibe logo" width={38} height={38} />
          <span className="gv-brand-name">GiniVibe</span>
        </a>
        <nav className="gv-nav" aria-label="Product sections">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="gv-header-cta">
          <button type="button" className="gv-btn gv-btn-ghost" onClick={() => onOpenAuth('login')}>
            Sign in
          </button>
          <button type="button" className="gv-btn gv-btn-primary" onClick={() => onOpenAuth('register')}>
            Get started
          </button>
          <button
            type="button"
            className="gv-menu-btn"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="gv-mobile-nav" aria-label="Product sections">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

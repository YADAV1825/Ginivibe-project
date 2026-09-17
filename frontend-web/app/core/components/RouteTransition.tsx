'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

type Phase = 'idle' | 'closing' | 'opening';
type Axis = 'v' | 'h';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// ~30% slower than the first pass: closing 0.44s, opening 0.78s.
const CLOSE_DURATION = 0.44;
const OPEN_DURATION = 0.78;

const ROUTE_LABELS: Record<string, string> = {
  home: 'Home',
  feed: 'Feed',
  search: 'Search',
  matching: 'Matching',
  events: 'Events',
  rooms: 'Rooms',
  messages: 'Messages',
  astrology: 'Astrology',
  gini_ai: 'Gini AI',
  profile: 'Profile',
  settings: 'Settings',
  'video-call': 'Video Call',
  login: 'Login',
  register: 'Join GiniVibe',
  enterprise: 'Enterprise',
  'enterprise-dashboard': 'Enterprise',
  'admin-login': 'Admin',
  'admin-dashboard': 'Admin',
};

function labelForPath(path: string): string {
  const seg = path.split('?')[0].split('/').filter(Boolean)[0] || 'home';
  return (
    ROUTE_LABELS[seg] ||
    seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Cinematic split-reveal for every in-app navigation.
 * Lives in the root layout so it survives the route swap:
 *  - click on any internal link → lime halves converge, then split open
 *  - forward navigation splits vertically (left/right halves)
 *  - going back to the exact previous page splits horizontally (top/bottom)
 * Direct loads, refreshes and back/forward get the opening reveal only.
 */
export function RouteTransition() {
  const pathname = usePathname();
  // Constant initializers on purpose: anything reading window here would
  // hydrate differently on server vs client. Real values sync in effects.
  const [phase, setPhase] = useState<Phase>('opening');
  const [axis, setAxis] = useState<Axis>('v');
  const [label, setLabel] = useState('GiniVibe');
  const [reduceMotion, setReduceMotion] = useState(false);
  const prevPath = useRef<string | null>(null);
  const trail = useRef<string[]>([]);

  // Client-only sync after hydration (no SSR mismatch).
  useEffect(() => {
    setLabel(labelForPath(window.location.pathname));
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    trail.current = [window.location.pathname];
  }, []);

  // Closing kick: any plain left-click on an internal link to a new path.
  // Axis is decided now: back-to-previous → horizontal, else vertical.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      let dest: URL;
      try {
        dest = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return;
      if (dest.pathname === window.location.pathname) return;
      const t = trail.current;
      setAxis(t.length >= 2 && t[t.length - 2] === dest.pathname ? 'h' : 'v');
      setLabel(labelForPath(dest.pathname));
      setPhase('closing');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Arrival: any pathname change → split open, then unmount.
  // Popstate (back/forward buttons) lands here with no prior click.
  useEffect(() => {
    if (prevPath.current !== pathname) {
      const t = trail.current;
      if (t.length === 0) {
        trail.current = [pathname];
      } else if (t.length >= 2 && t[t.length - 2] === pathname) {
        setAxis('h');
        trail.current = t.slice(0, -1);
      } else if (t[t.length - 1] !== pathname) {
        setAxis('v');
        trail.current = [...t, pathname];
      }
      setLabel(labelForPath(pathname));
      setPhase('opening');
      const timer = window.setTimeout(() => setPhase('idle'), 1250);
      prevPath.current = pathname;
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [pathname]);

  // Safety: never get stuck covering the screen.
  useEffect(() => {
    if (phase !== 'closing') return undefined;
    const t = window.setTimeout(() => setPhase('idle'), 3500);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (reduceMotion || phase === 'idle') return null;

  const closed = phase === 'closing';
  const vertical = axis === 'v';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0"
      style={{ zIndex: 100, pointerEvents: closed ? 'auto' : 'none' }}
    >
      {vertical ? (
        <>
          {/* left half */}
          <motion.div
            key="left"
            className="absolute bottom-0 left-0 top-0 w-1/2"
            style={{
              background: 'linear-gradient(to right, #c8ff4d, #b6ff2e)',
              boxShadow: '12px 0 40px rgba(0,0,0,0.35)',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: closed ? '0%' : '-100%' }}
            transition={{ duration: closed ? CLOSE_DURATION : OPEN_DURATION, ease: EASE }}
          />
          {/* right half */}
          <motion.div
            key="right"
            className="absolute bottom-0 right-0 top-0 w-1/2"
            style={{
              background: 'linear-gradient(to left, #c8ff4d, #b6ff2e)',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.35)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: closed ? '0%' : '100%' }}
            transition={{ duration: closed ? CLOSE_DURATION : OPEN_DURATION, ease: EASE }}
          />
        </>
      ) : (
        <>
          {/* top half */}
          <motion.div
            key="top"
            className="absolute left-0 right-0 top-0 h-1/2"
            style={{
              background: 'linear-gradient(to bottom, #c8ff4d, #b6ff2e)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            }}
            initial={{ y: '-100%' }}
            animate={{ y: closed ? '0%' : '-100%' }}
            transition={{ duration: closed ? CLOSE_DURATION : OPEN_DURATION, ease: EASE }}
          />
          {/* bottom half */}
          <motion.div
            key="bottom"
            className="absolute bottom-0 left-0 right-0 h-1/2"
            style={{
              background: 'linear-gradient(to top, #c8ff4d, #b6ff2e)',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.35)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: closed ? '0%' : '100%' }}
            transition={{ duration: closed ? CLOSE_DURATION : OPEN_DURATION, ease: EASE }}
          />
        </>
      )}
      {/* seam emblem while covered */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: closed ? 1 : 0, scale: closed ? 1 : 0.85 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <span
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '999px',
            background: '#23262f',
            color: '#b6ff2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={24} />
        </span>
        <span
          className="font-display"
          style={{ color: '#23262f', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.01em' }}
        >
          {label}
        </span>
      </motion.div>
    </div>
  );
}

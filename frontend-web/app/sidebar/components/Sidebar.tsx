'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/core/providers/AuthProvider';
import {
  Home, Search, Rss, Heart, CalendarDays, Sparkles, Bot, MessageCircle,
  User as UserIcon, Settings, LogOut, ChevronDown, Check, Radio, Compass,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavEntry {
  label: string;
  href: string;
  icon: React.ElementType;
}

const MAIN_SECTIONS: NavEntry[] = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Feed', href: '/feed', icon: Rss },
  { label: 'Matching', href: '/matching', icon: Heart },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Rooms', href: '/rooms', icon: Radio },
  { label: 'Messages', href: '/messages', icon: MessageCircle },
  { label: 'Astrology', href: '/astrology', icon: Sparkles },
  { label: 'Gini AI', href: '/gini_ai', icon: Bot },
];

const PERSONAL_SECTIONS: NavEntry[] = [
  { label: 'Profile', href: '/profile', icon: UserIcon },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function prettySegment(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean).pop() ?? 'home';
  return seg
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const allSections = useMemo(
    () => [...MAIN_SECTIONS, ...PERSONAL_SECTIONS],
    [],
  );

  const current: NavEntry = useMemo(() => {
    const exact = allSections.find((s) => pathname === s.href);
    if (exact) return exact;
    const nested = allSections.find(
      (s) => s.href !== '/home' && pathname?.startsWith(`${s.href}/`),
    );
    if (nested) return nested;
    return { label: prettySegment(pathname ?? '/home'), href: pathname ?? '/home', icon: Compass };
  }, [allSections, pathname]);

  // Close on outside pointer-down and on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const CurrentIcon = current.icon;

  return (
    <header ref={rootRef} className={styles.notchBar}>
      {/* Left notch: brand */}
      <Link href="/home" className={styles.brand} aria-label="GiniVibe home">
        <span className={styles.brandMark}>
          <img src="/logo.jpeg" alt="" width={30} height={30} />
        </span>
        <span className={styles.brandName}>GiniVibe</span>
      </Link>

      <span className={styles.zoneDivider} aria-hidden="true" />

      {/* Center notch: dynamic section switcher */}
      <div className={styles.sectionWrap}>
        <button
          type="button"
          className={styles.sectionTrigger}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <CurrentIcon size={18} className={styles.sectionTriggerIcon} aria-hidden="true" />
          <span className={styles.sectionTriggerLabel}>{current.label}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`${styles.sectionChevron} ${menuOpen ? styles.sectionChevronOpen : ''}`}
          />
        </button>

        {menuOpen && (
          <nav className={styles.sectionMenu} aria-label="App sections">
            <ul role="menu" className={styles.sectionList}>
              {MAIN_SECTIONS.map((item) => {
                const isActive = item.href === current.href;
                const ItemIcon = item.icon;
                return (
                  <li key={item.href} role="none">
                    <Link
                      role="menuitem"
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`${styles.sectionItem} ${isActive ? styles.sectionItemActive : ''}`}
                    >
                      <ItemIcon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                      {isActive && <Check size={16} className={styles.sectionCheck} aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={styles.sectionDivider} />
            <ul role="menu" className={styles.sectionList}>
              {PERSONAL_SECTIONS.map((item) => {
                const isActive = item.href === current.href;
                const ItemIcon = item.icon;
                return (
                  <li key={item.href} role="none">
                    <Link
                      role="menuitem"
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`${styles.sectionItem} ${isActive ? styles.sectionItemActive : ''}`}
                    >
                      <ItemIcon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                      {isActive && <Check size={16} className={styles.sectionCheck} aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>

      <span className={styles.zoneDivider} aria-hidden="true" />

      {/* Right notch: identity + sign out */}
      <div className={styles.actions}>
        <Link
          href="/profile"
          className={styles.avatarLink}
          aria-label={user?.name ? `${user.name}'s profile` : 'Your profile'}
          title={user?.name || 'Profile'}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" width={30} height={30} className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              <UserIcon size={16} />
            </span>
          )}
        </Link>
        <button
          type="button"
          className={styles.signOut}
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

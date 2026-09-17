'use client';

import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarPerson {
  id?: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
}

function displayName(person: AvatarPerson): string {
  const full = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return full || person.username || 'User';
}

function initialsOf(person: AvatarPerson): string {
  const name = displayName(person);
  const parts = name.replace(/^@/, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/** Stable pastel wash per person so stacks look lively but stay on-palette. */
function toneOf(person: AvatarPerson): string {
  const name = displayName(person);
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `${styles.avatar} ${[styles.toneA, styles.toneB, styles.toneC, styles.toneD][hash % 4]}`;
}

interface AvatarProps {
  person: AvatarPerson;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/** Circle avatar: photo when available, graphite-on-pastel initials otherwise. */
export function Avatar({ person, size = 'md' }: AvatarProps) {
  const name = displayName(person);
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => {
    setImgFailed(false);
  }, [person.imageUrl]);
  const showPhoto = Boolean(person.imageUrl && !imgFailed);
  return (
    <span
      className={`${toneOf(person)} ${styles[size]}`}
      title={name}
      aria-label={name}
      role="img"
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.imageUrl as string}
          alt=""
          className={styles.photo}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(person)}</span>
      )}
    </span>
  );
}

interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
}

/** Overlapping face pile with a "+N" bubble, for attendees and commenters. */
export function AvatarStack({ people, max = 4, size = 'sm', label }: AvatarStackProps) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className={styles.stack} aria-label={label ?? `${people.length} people`}>
      {shown.map((person, index) => (
        <span key={person.id ?? `${person.username}-${index}`} className={styles.stackItem}>
          <Avatar person={person} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className={`${styles.avatar} ${styles[size]} ${styles.more}`} aria-hidden="true">
          +{extra}
        </span>
      )}
    </span>
  );
}

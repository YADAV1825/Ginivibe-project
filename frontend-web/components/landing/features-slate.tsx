'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
} from 'motion/react';
import {
  ArrowRight, Lock, MapPin, Search, Video,
  MessageSquare, Mic, Users, Globe,
} from 'lucide-react';
import { LandingPostCard } from './post-card';
import { NorthIndianChart } from '@/app/(dashboard)/astrology/components/NorthIndianChart';
import { mockEvents } from '@/app/(dashboard)/events/utils/data';
import { parseIntent, scoreProfiles, PRESETS, DEFAULT_INTENT } from '@/lib/matching-demo';
import { MapPin as MapPinIcon, Briefcase, Sparkles, Orbit } from 'lucide-react';
import type { Post } from '@/lib/api/feed';
import type { CalculatedPlanet, HouseInfo } from '@/types';

/* ------------------------------------------------------------------ */
/* Shared sample data (moved from the retired chapter sections).       */
/* ------------------------------------------------------------------ */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

const SAMPLE_POSTS: Post[] = [
  {
    id: 'landing-post-1',
    userId: 'sample-u1',
    title: null,
    body: 'Matched with a founder in Delhi through one sentence: early-stage fintech, likes trekking. We talked for an hour in a voice room. This is how meeting people should feel.',
    mediaUrls: [],
    contentType: 'text',
    viewsCount: 1284,
    createdAt: hoursAgo(2),
    user: { id: 'sample-u1', username: 'ananya.builds', firstName: 'Ananya', lastName: 'Sharma' },
    community: { id: 'c-founders', name: 'Founders' },
    _count: { likes: 48, comments: 6 },
  },
  {
    id: 'landing-post-2',
    userId: 'sample-u2',
    title: 'Sunday listening room was full',
    body: '32 people showed up for the jazz session last night. Hosting another one this weekend. Voice room, open to everyone. Bring one track that raised you.',
    mediaUrls: [],
    contentType: 'text',
    viewsCount: 862,
    createdAt: hoursAgo(9),
    user: { id: 'sample-u2', username: 'arjun', firstName: 'Arjun', lastName: 'Malhotra' },
    community: null,
    _count: { likes: 91, comments: 14 },
  },
];

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function makePlanet(
  planet: string, signIndex: number, degree: number, house: number, retrograde = false,
): CalculatedPlanet {
  return {
    planet,
    sign: SIGN_NAMES[signIndex],
    sign_index: signIndex,
    degree,
    house,
    absolute_longitude: signIndex * 30 + degree,
    retrograde,
  };
}

/* Representative Janma chart (D1). Lagna: Leo. */
const SAMPLE_D1: { houses: Record<number, HouseInfo>; planets: Record<string, CalculatedPlanet> } = (() => {
  const planets = [
    makePlanet('Sun', 4, 12, 1),
    makePlanet('Moon', 1, 24, 10),
    makePlanet('Mars', 7, 8, 4),
    makePlanet('Mercury', 5, 19, 2),
    makePlanet('Jupiter', 8, 3, 5),
    makePlanet('Venus', 6, 27, 3),
    makePlanet('Saturn', 10, 15, 7),
    makePlanet('Rahu', 0, 21, 9),
    makePlanet('Ketu', 6, 21, 3),
  ];
  const houseSigns = [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3];
  const houses: Record<number, HouseInfo> = {};
  houseSigns.forEach((signIndex, i) => {
    const house = i + 1;
    houses[house] = {
      sign: SIGN_NAMES[signIndex],
      sign_index: signIndex,
      planets: planets.filter((p) => p.house === house),
    };
  });
  const planetMap: Record<string, CalculatedPlanet> = {};
  planets.forEach((p) => { planetMap[p.planet] = p; });
  return { houses, planets: planetMap };
})();

const HOUSE_MEANINGS = [
  { house: '1st house', title: 'Self and temperament', text: 'How you come across and how you meet the world.' },
  { house: '4th house', title: 'Home and roots', text: 'What steadies you and where you recharge.' },
  { house: '7th house', title: 'Partnerships', text: 'What you need from close relationships. The compatibility lens.' },
  { house: '10th house', title: 'Work and direction', text: 'Where your effort compounds. Your natural arenas for success.' },
];

const ROOM_TYPE_ICON = { TEXT: MessageSquare, VOICE: Mic, VIDEO: Video } as const;

const SAMPLE_ROOMS = [
  { name: 'Delhi Founders Weekly Sync', type: 'VOICE' as const, open: true, count: 23, cap: 50 },
  { name: 'Sci-Fi Book Club Sundays', type: 'TEXT' as const, open: true, count: 148, cap: 500 },
  { name: 'Speed Matching Friday', type: 'VIDEO' as const, open: false, count: 12, cap: 20 },
];

const GINI_CHARACTERS = [
  { src: '/avatars/image_000.png', name: 'Meera', trait: 'Late night philosophy' },
  { src: '/avatars/image_001.png', name: 'Kabir', trait: 'Startup sparring partner' },
  { src: '/avatars/image_002.png', name: 'Ishita', trait: 'Cinema and sound' },
];

const EVENT_TYPE_LABEL: Record<string, string> = {
  live: 'Live now',
  online: 'Online',
  offline: 'In person',
  future: 'Upcoming',
};

const CRITERION_ICON = {
  location: MapPinIcon,
  profession: Briefcase,
  interest: Sparkles,
  sign: Orbit,
} as const;

/* ------------------------------------------------------------------ */
/* Compact matching lab for the slate (top 2 matches, no step rail).   */
/* ------------------------------------------------------------------ */

function CompactLab() {
  const [intent, setIntent] = useState(DEFAULT_INTENT);
  const [submitted, setSubmitted] = useState(DEFAULT_INTENT);

  const criteria = useMemo(() => parseIntent(submitted), [submitted]);
  const matches = useMemo(() => scoreProfiles(criteria).slice(0, 2), [criteria]);

  return (
    <div className="gv-slate-lab">
      <form
        className="gv-intent-row"
        role="search"
        aria-label="Try AI matching"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(intent);
        }}
      >
        <label htmlFor="slate-intent" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
          Describe who you want to meet
        </label>
        <input
          id="slate-intent"
          type="text"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="I want to connect with a founder in Delhi."
          autoComplete="off"
          maxLength={160}
        />
        <button type="submit" className="gv-btn gv-btn-primary">
          <Search size={16} aria-hidden="true" />
          Find
        </button>
      </form>
      <div className="gv-presets" role="group" aria-label="Example intents">
        {PRESETS.slice(0, 2).map((preset) => (
          <button
            key={preset}
            type="button"
            className="gv-preset"
            onClick={() => {
              setIntent(preset);
              setSubmitted(preset);
            }}
          >
            {preset.length > 44 ? `${preset.slice(0, 44)}…` : preset}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {matches.length > 0 ? (
          <>
            <div className="gv-criteria" aria-label="Understood criteria">
              {criteria.map((c, i) => {
                const Icon = CRITERION_ICON[c.kind];
                return (
                  <span
                    key={`${submitted}-${c.kind}-${c.value}`}
                    className="gv-criterion"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {c.label}
                  </span>
                );
              })}
            </div>
            <ul className="gv-matches" key={submitted}>
              {matches.map(({ profile, score, reasons }, i) => (
                <li
                  key={profile.name}
                  className="gv-match"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <div className="gv-match-avatar" aria-hidden="true">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <div className="gv-match-name">
                      {profile.name}, {profile.age}
                    </div>
                    <div className="gv-match-meta">
                      {profile.profession} in {profile.location}, {profile.sunSign} sun
                    </div>
                    <p className="gv-match-why">
                      <strong>Why: </strong>
                      {reasons[0]}
                    </p>
                  </div>
                  <div className="gv-match-score">
                    <b>{score}</b>
                    <span>match</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="gv-lab-empty">
            Name a city, a profession or an interest, and the matcher will read the criteria.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pane bodies: condensed copy plus one visual each.                   */
/* ------------------------------------------------------------------ */

interface PaneCopyProps {
  title: string;
  lede: string;
  linkHref: string;
  linkLabel: string;
}

function PaneCopy({ title, lede, linkHref, linkLabel }: PaneCopyProps) {
  return (
    <div className="gv-slate-copy">
      <h2>{title}</h2>
      <p>{lede}</p>
      <Link href={linkHref} className="gv-link-arrow">
        {linkLabel} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

function MatchingPane() {
  return (
    <>
      <PaneCopy
        title="Describe who you want to meet."
        lede="State your intent in plain language. The AI shows you people worth your time, with reasons attached."
        linkHref="/matching"
        linkLabel="Open live matching"
      />
      <div className="gv-slate-visual">
        <CompactLab />
      </div>
    </>
  );
}

function FeedPane() {
  return (
    <>
      <PaneCopy
        title="Watch what your people are up to."
        lede="Posts from people and communities you follow, with likes, comments, and view counts updating live."
        linkHref="/feed"
        linkLabel="Open the live feed"
      />
      <div className="gv-slate-visual">
        <LandingPostCard post={SAMPLE_POSTS[0]} />
      </div>
    </>
  );
}

function MessagesPane() {
  return (
    <>
      <PaneCopy
        title="Conversations that start with context."
        lede="Every chat carries its origin: a match, a room, an event. Strangers wait in requests until you accept."
        linkHref="/messages"
        linkLabel="Open messages"
      />
      <div className="gv-slate-visual">
        <div className="gv-panel" aria-label="Example conversation">
          <div className="gv-thread-head">
            <div className="gv-match-avatar" aria-hidden="true">R</div>
            <div>
              <div className="gv-thread-name">Rohan Mehta</div>
              <div className="gv-thread-sub">Matched for a designer in Delhi who cycles</div>
            </div>
            <span className="gv-chip">
              <Lock size={12} aria-hidden="true" /> Encrypted
            </span>
          </div>
          <div className="gv-thread-body">
            <div className="gv-request-note">
              <MessageSquare size={15} aria-hidden="true" />
              <span>Request accepted. Rohan found you through AI matching.</span>
            </div>
            <p className="gv-bubble them">That was a fun voice room last night. You ride every weekend?</p>
            <p className="gv-bubble me">Most Sundays, Lodhi loop at 6am. You should join this week.</p>
            <p className="gv-bubble them">I am in. Are you going to the founder breakfast?</p>
          </div>
        </div>
      </div>
    </>
  );
}

function EventsPane() {
  return (
    <>
      <PaneCopy
        title="Online when you are in. Real rooms when you are out."
        lede="Host a video hangout or a park meetup with the same flow. Screen and street, one social life."
        linkHref="/events"
        linkLabel="Browse and host events"
      />
      <div className="gv-slate-visual">
        <div className="gv-panel gv-events gv-slate-events">
          {mockEvents.slice(0, 2).map((event, i) => {
            const date = new Date(event.date);
            const CoverIcon = event.location ? MapPin : Video;
            return (
              <article key={event.id} className="gv-event">
                {event.imageUrl ? (
                  <img className="gv-event-media" src={event.imageUrl} alt="" loading="lazy" />
                ) : (
                  <div
                    className={`gv-event-fallback${i % 2 === 1 ? ' is-dark' : ''}`}
                    aria-hidden="true"
                  >
                    <CoverIcon size={40} />
                    <span>{EVENT_TYPE_LABEL[event.type] ?? event.type}</span>
                  </div>
                )}
                <div className="gv-event-body">
                  <div className="gv-event-date" aria-label={date.toDateString()}>
                    <b>{date.getDate()}</b>
                    <span>{date.toLocaleString('en-US', { month: 'short' })}</span>
                  </div>
                  <div>
                    <p className="gv-event-type">{EVENT_TYPE_LABEL[event.type] ?? event.type}</p>
                    <h3 className="gv-event-title">{event.title}</h3>
                    <div className="gv-event-meta">
                      <span><Users size={14} aria-hidden="true" />{event.attendeesCount} going</span>
                      {event.location ? (
                        <span><MapPin size={14} aria-hidden="true" />{event.location}</span>
                      ) : (
                        <span><Video size={14} aria-hidden="true" />Video</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AstrologyPane() {
  return (
    <>
      <PaneCopy
        title="A mirror, not a crystal ball."
        lede="Your Vedic chart, D1 and D9, explained house by house. No fortune-telling, just self-understanding."
        linkHref="/astrology"
        linkLabel="Compute your chart"
      />
      <div className="gv-slate-visual">
        <div className="gv-panel">
          <div className="gv-panel-pad">
            <div className="gv-astro-chart gv-slate-chart">
              <NorthIndianChart data={SAMPLE_D1} title="Janma Chart (D1), sample" />
            </div>
          </div>
          <ul className="gv-house-strip gv-slate-houses" aria-label="What the houses represent">
            {HOUSE_MEANINGS.map((h) => (
              <li key={h.house}>
                <b>{h.house}</b>
                <span><strong>{h.title}.</strong> {h.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function RoomsPane() {
  return (
    <>
      <PaneCopy
        title="Group hangs in text, voice and video."
        lede="Open lounges anyone can join, or private rooms with invites. Create one in seconds."
        linkHref="/rooms"
        linkLabel="Join a room"
      />
      <div className="gv-slate-visual">
        <div className="gv-panel" role="list" aria-label="Example rooms">
          {SAMPLE_ROOMS.map((room) => {
            const Icon = ROOM_TYPE_ICON[room.type];
            return (
              <div key={room.name} className="gv-room" role="listitem">
                <div className="gv-room-icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div>
                  <div className="gv-room-name">{room.name}</div>
                  <div className="gv-room-meta">
                    <span>{room.type === 'TEXT' ? 'Text chat' : room.type === 'VOICE' ? 'Voice room' : 'Video call'}</span>
                    <span>
                      {room.open ? <Globe size={13} aria-hidden="true" /> : <Lock size={13} aria-hidden="true" />}
                      {room.open ? 'Open' : 'Private'}
                    </span>
                  </div>
                </div>
                <div className="gv-room-count">{room.count}/{room.cap} in</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function GiniAiPane() {
  return (
    <>
      <PaneCopy
        title="Characters with a point of view."
        lede="Discover community-made AI characters, create your own, and chat whenever you want."
        linkHref="/gini_ai"
        linkLabel="Meet the characters"
      />
      <div className="gv-slate-visual">
        <div className="gv-panel gv-panel-pad">
          <div className="gv-avatar-rail gv-slate-avatars" role="list" aria-label="Example AI characters">
            {GINI_CHARACTERS.map((c) => (
              <div key={c.src} className="gv-avatar-cell" role="listitem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={`${c.name}, AI character portrait`} loading="lazy" />
                <div className="gv-avatar-meta">
                  <b>{c.name}</b>
                  <span>{c.trait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The deck: one calm card per feature, plain vertical flow.          */
/* ------------------------------------------------------------------ */

const PANES = [
  { id: 'matching', label: 'AI matching', Body: MatchingPane },
  { id: 'feed', label: 'Feed', Body: FeedPane },
  { id: 'messages', label: 'Messages', Body: MessagesPane },
  { id: 'events', label: 'Events', Body: EventsPane },
  { id: 'astrology', label: 'Astrology', Body: AstrologyPane },
  { id: 'rooms', label: 'Rooms', Body: RoomsPane },
  { id: 'gini-ai', label: 'Gini AI', Body: GiniAiPane },
];

/* ------------------------------------------------------------------ */
/* Sticky stacking cards. Motion language adapted from Skiper UI's      */
/* Skiper34 (StickyCard_003) by Gurvinder Singh (@gurvinder-singh02,   */
/* https://gxuri.me) — free version, attribution kept here as required */
/* (https://skiper-ui.com). Each card pins while the next one slides   */
/* over it; the pinned card scales down and tilts slightly. Content    */
/* cards (not images), so the tilt is kept subtle for readability.     */
/* ------------------------------------------------------------------ */

const STICK_TOP_VH = 12;
const SHRINK_PX = 6000;
const MAX_TILT_DEG = 5;
const MIN_SCALE = 0.9;

function StickyFeatCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxScrollY, setMaxScrollY] = useState(Infinity);
  const [reduced, setReduced] = useState(false);
  const scale = useMotionValue(1);
  const tilt = useMotionValue(0);
  const { scrollY } = useScroll({ target: ref });
  const isInView = useInView(ref, {
    margin: `0px 0px -88% 0px`,
    once: true,
  });

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (isInView) setMaxScrollY(scrollY.get());
  }, [isInView, scrollY]);

  useEffect(() => {
    const stop = scrollY.on('change', (y) => {
      const t = y > maxScrollY ? Math.min(1, (y - maxScrollY) / SHRINK_PX) : 0;
      scale.set(1 - t * (1 - MIN_SCALE));
      tilt.set(t * MAX_TILT_DEG);
    });
    return stop;
  }, [scrollY, maxScrollY, scale, tilt]);

  if (reduced) {
    return <div className="gv-feat-card">{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className="gv-feat-card"
      style={{
        position: 'sticky',
        top: `${STICK_TOP_VH}vh`,
        scale,
        rotate: tilt,
        // Own compositor layer: the scroll-linked transform never triggers a
        // repaint of the card contents (kills mobile flicker, keeps motion).
        willChange: 'transform',
      }}
    >
      {children}
    </motion.div>
  );
}

export function FeaturesSlate() {
  return (
    <section className="gv-feat" aria-label="Features">
      <div className="gv-wrap">
        <p className="gv-feat-eyebrow">Everything inside</p>
        <h2 className="gv-feat-title">One vibe, every way to meet</h2>
        <p className="gv-feat-sub">Seven ways to find your people, your rooms, your rhythm.</p>
        <div className="gv-feat-deck">
          {PANES.map((pane, i) => (
            <StickyFeatCard key={pane.id}>
              <article id={pane.id} aria-label={pane.label} className="gv-feat-pane">
                <div className="gv-feat-pane-head">
                  <span className="gv-feat-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="gv-chip">{pane.label}</span>
                </div>
                <div className="gv-feat-pane-body">
                  <pane.Body />
                </div>
              </article>
            </StickyFeatCard>
          ))}
        </div>
      </div>
    </section>
  );
}

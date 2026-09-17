'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, CalendarDays, MapPin, Users, Video, X } from 'lucide-react';
import { useOutsideClick } from '@/hooks/use-outside-click';
import type { ServiceEvent } from '@/app/(dashboard)/events/api/events';
import { formatCount } from '@/app/(dashboard)/events/api/events';

export function EventDateBadge({ startAt, overImage }: { startAt: string; overImage: boolean }) {
  const start = new Date(startAt);
  const day = start.getDate();
  const month = start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1,
      minWidth: '52px', padding: '6px 8px', borderRadius: '12px',
      background: overImage ? 'rgba(35, 38, 47, 0.85)' : 'color-mix(in srgb, #b6ff2e 30%, #fffdf7)',
      color: overImage ? '#f8e7c9' : '#23262f',
      border: overImage ? 'none' : '1px solid rgba(35,38,47,0.14)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{day}</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>{month}</span>
    </span>
  );
}

function longDateTime(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface EventsExpandableListProps {
  events: ServiceEvent[];
  rsvpId: string | null;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  onOpenFull: (eventId: string) => void;
}

export function EventsExpandableList({ events, rsvpId, onJoin, onLeave, onOpenFull }: EventsExpandableListProps) {
  const [active, setActive] = useState<ServiceEvent | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    document.body.style.overflow = active ? 'hidden' : 'auto';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const renderDetailsButton = (event: ServiceEvent) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActive(event);
        }}
        style={{
          padding: '8px 18px',
          borderRadius: '999px',
          fontWeight: 800,
          fontSize: '0.82rem',
          background: '#fffdf7',
          color: '#23262f',
          border: '1px solid rgba(35,38,47,0.2)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        View Details
      </button>
    );
  };

  // Explicit join control: opening the joining link NEVER changes RSVP —
  // only these tick/x buttons do.
  const renderJoinControl = (event: ServiceEvent) => {
    const going = event.userAttendanceStatus === 'GOING';
    const waitlisted = event.waitlistStatus === 'WAITLISTED';
    const hasRsvp = going || waitlisted || event.userAttendanceStatus !== null;
    const busy = rsvpId === event.id;
    const tickActive = going;
    const crossActive = !going && !waitlisted && event.userAttendanceStatus !== null;
    const btn = (highlighted: boolean, danger = false): React.CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '12px 22px',
      borderRadius: '999px',
      fontWeight: 800,
      fontSize: '0.95rem',
      background: highlighted ? (danger ? '#fde7e7' : '#b6ff2e') : '#fffdf7',
      color: danger && highlighted ? '#b3402a' : '#23262f',
      border: highlighted && !danger
        ? '1px solid rgba(35,38,47,0.3)'
        : '1px solid rgba(35,38,47,0.2)',
      boxShadow: highlighted && !danger ? '0 3px 12px rgba(35,38,47,0.18)' : 'none',
      opacity: busy ? 0.6 : 1,
      cursor: busy ? 'wait' : 'pointer',
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4b4f5c' }}>
          Are you joining?
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={busy}
            aria-pressed={going}
            title={going ? 'Leave event' : 'Join event'}
            onClick={(e) => {
              e.stopPropagation();
              if (going) onLeave(event.id);
              else onJoin(event.id);
            }}
            style={btn(tickActive)}
          >
            <span aria-hidden="true">✓</span> {busy && !going ? 'Saving…' : going ? 'Going' : 'Yes'}
          </button>
          <button
            type="button"
            disabled={busy || !hasRsvp}
            title="Not going — remove my RSVP"
            onClick={(e) => {
              e.stopPropagation();
              onLeave(event.id);
            }}
            style={btn(crossActive, true)}
          >
            <span aria-hidden="true">✕</span> No
          </button>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#4b4f5c' }}>
          {going
            ? 'You are on the list.'
            : waitlisted
              ? `On the waitlist${event.waitlistPosition ? ` (#${event.waitlistPosition})` : ''}.`
              : 'You are not going yet.'}
        </span>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 h-full w-full bg-black/30"
            style={{ zIndex: 90 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center p-4" style={{ zIndex: 100 }}>
            <motion.button
              key={`close-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full lg:hidden"
              style={{ background: '#fffdf7', color: '#23262f' }}
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              <X size={14} aria-hidden="true" />
            </motion.button>

            <motion.div
              layoutId={`event-card-${active.id}-${id}`}
              ref={ref}
              className="flex h-full w-full max-w-[540px] flex-col overflow-hidden sm:rounded-3xl md:h-fit md:max-h-[90%]"
              style={{ background: '#ffffff', border: '1px solid rgba(35,38,47,0.14)', color: '#23262f' }}
            >
              {active.bannerImageUrl ? (
                <motion.div layoutId={`event-media-${active.id}-${id}`} className="relative h-52 shrink-0 overflow-hidden sm:rounded-t-3xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.bannerImageUrl} alt={active.title} className="h-full w-full object-cover" />
                  <div className="absolute left-4 top-4">
                    <EventDateBadge startAt={active.startAt} overImage />
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 px-5 pt-5">
                  <EventDateBadge startAt={active.startAt} overImage={false} />
                  <span
                    style={{
                      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
                      color: active.status === 'LIVE' ? '#b3402a' : '#4d7c0f',
                    }}
                  >
                    {active.status === 'LIVE' ? '● Live now' : active.status === 'FUTURE' ? 'Upcoming' : 'Ended'}
                  </span>
                </div>
              )}

              <div className="flex flex-col overflow-y-auto p-5">
                <motion.h3
                  layoutId={`event-title-${active.id}-${id}`}
                  className="font-display"
                  style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#23262f', margin: 0 }}
                >
                  {active.title}
                </motion.h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', color: '#4b4f5c', fontSize: '0.9rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDays size={15} aria-hidden="true" /> {longDateTime(active.startAt)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    {active.mode === 'OFFLINE' ? <MapPin size={15} aria-hidden="true" /> : <Video size={15} aria-hidden="true" />}
                    {active.mode === 'OFFLINE'
                      ? [active.venue, active.location].filter(Boolean).join(' · ') || 'Location to be announced'
                      : 'Online event'}
                  </span>
                  {(active.joinUrl || (active.mode === 'ONLINE' && active.meetingUrl)) && active.userAttendanceStatus === 'GOING' && (
                    <a
                      href={(active.joinUrl || active.meetingUrl)!}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4d7c0f', fontWeight: 800, fontSize: '0.9rem' }}
                    >
                      <Video size={15} aria-hidden="true" /> {active.mode === 'ONLINE' ? `Join meeting${active.platform ? ` via ${active.platform}` : ''}` : 'Open joining info'}
                    </a>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} aria-hidden="true" /> {formatCount(active.attendeeCount)} going{active.capacity ? ` · ${formatCount(active.capacity)} spots` : ''}
                  </span>
                </div>

                <p style={{ color: '#23262f', fontSize: '0.95rem', lineHeight: 1.65, margin: '14px 0 0' }}>
                  {active.description ?? 'No description provided.'}
                </p>

                <div className="flex flex-wrap items-center gap-3" style={{ marginTop: '18px' }}>
                  {renderJoinControl(active)}
                  <button
                    type="button"
                    onClick={() => { setActive(null); onOpenFull(active.id); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 18px', borderRadius: '999px', background: 'transparent', color: '#23262f', border: '1px solid rgba(35,38,47,0.2)', fontWeight: 700, fontSize: '0.9rem', alignSelf: 'flex-start', marginTop: '26px' }}
                  >
                    Full page <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ul className="flex w-full flex-col" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '10px' }}>
        {events.map((event, index) => (
          <motion.li
            layoutId={`event-card-${event.id}-${id}`}
            key={event.id}
            onClick={() => setActive(event)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 9) * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="gv-lift flex cursor-pointer items-center gap-4 p-4 sm:rounded-2xl"
            style={{ background: '#ffffff', border: '1px solid rgba(35,38,47,0.14)' }}
          >
            {event.bannerImageUrl ? (
              <motion.div layoutId={`event-media-${event.id}-${id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.bannerImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </motion.div>
            ) : (
              <EventDateBadge startAt={event.startAt} overImage={false} />
            )}
            <div className="min-w-0 flex-1">
              <motion.h3
                layoutId={`event-title-${event.id}-${id}`}
                className="font-display truncate"
                style={{ fontSize: '1.02rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#23262f', margin: 0 }}
              >
                {event.title}
              </motion.h3>
              <p className="truncate" style={{ color: '#4b4f5c', fontSize: '0.84rem', margin: '3px 0 0' }}>
                {longDateTime(event.startAt)} · {event.mode === 'OFFLINE' ? (event.venue ?? event.location ?? 'In person') : 'Online'} · {formatCount(event.attendeeCount)} going
              </p>
            </div>
            {renderDetailsButton(event)}
          </motion.li>
        ))}
      </ul>
    </>
  );
}

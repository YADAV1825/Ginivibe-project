'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ImagePlus, MapPin, Users, Video, X } from 'lucide-react';
import { Button } from '@/app/core/components/Button';
import inputStyles from '@/app/core/components/ui.module.css';
import { Calendar } from '@/app/core/components/Calendar';
import { EventsApi, type EventMode } from '@/app/(dashboard)/events/api/events';
import styles from './CreateEventForm.module.css';

function combine(date: Date | null, time: string): Date | null {
  if (!date) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
}

function formatLong(date: Date | null): string {
  if (!date) return 'Pick a date';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function DateField({
  label,
  date,
  time,
  onDate,
  onTime,
  minDate,
}: {
  label: string;
  date: Date | null;
  time: string;
  onDate: (date: Date) => void;
  onTime: (time: string) => void;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  return (
    <div className={inputStyles.inputWrapper}>
      <span className={inputStyles.inputLabel}>{label}</span>
      <div className={styles.dateRow} ref={wrapRef}>
        <button
          type="button"
          className={`${styles.dateButton} ${date ? '' : styles.dateButtonEmpty}`}
          onClick={() => setOpen((isOpen) => !isOpen)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <CalendarDays size={16} aria-hidden="true" />
          {formatLong(date)}
        </button>
        <input
          type="time"
          className={`${inputStyles.inputField} ${styles.timeInput}`}
          value={time}
          onChange={(event) => onTime(event.target.value)}
          aria-label={`${label} time`}
        />
        {open && (
          <div className={styles.calendarPopover} role="dialog" aria-label={`${label} calendar`}>
            <Calendar
              value={date ?? undefined}
              minDate={minDate}
              onChange={(picked) => {
                onDate(picked);
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CreateEventForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('18:00');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState('20:00');
  const [mode, setMode] = useState<EventMode>('ONLINE');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBannerPreviewUrl(URL.createObjectURL(file));
    setBannerImageUrl(null);
    setError(null);
    setImageUploading(true);
    try {
      const url = await EventsApi.uploadImage(file);
      setBannerImageUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload image');
      setBannerPreviewUrl(null);
    } finally {
      setImageUploading(false);
    }
  };

  const submit = async () => {
    const start = combine(startDate, startTime);
    const end = combine(endDate, endTime);
    if (!title.trim() || !start || !end) return setError('Give your event a title, a start, and an end.');
    if (mode === 'ONLINE' && !meetingUrl.trim()) return setError('Online events need a meeting link so people can join.');
    if (mode === 'OFFLINE' && (!venue.trim() || !location.trim())) return setError('In-person events need a venue and a location.');
    if (imageUploading) return setError('Your event image is still uploading.');
    if (end <= start) return setError('End time must be after start time.');
    setSaving(true);
    setError(null);
    try {
      await EventsApi.create({
        title: title.trim(),
        description: description.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        mode,
        meetingUrl: mode === 'ONLINE' ? meetingUrl.trim() : undefined,
        joinUrl: joinUrl.trim() || (mode === 'ONLINE' ? meetingUrl.trim() : undefined) || undefined,
        platform: mode === 'ONLINE' ? platform.trim() || undefined : undefined,
        venue: mode === 'OFFLINE' ? venue.trim() : undefined,
        location: mode === 'OFFLINE' ? location.trim() : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        bannerImageUrl: bannerImageUrl ?? undefined,
      });
      onCreated();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.formHead}>
        <div>
          <h2 className={styles.formTitle}>Create an event</h2>
          <p className={styles.formSubtitle}>Hangouts, speed matching, watch parties — online or around you.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {bannerPreviewUrl ? (
        <div className={styles.bannerPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerPreviewUrl}
            alt="Event banner preview"
            className={styles.bannerImage}
            style={{ opacity: imageUploading ? 0.6 : 1 }}
          />
          {imageUploading && <span className={styles.uploadingBadge}>Uploading…</span>}
          <button type="button" className={styles.removeBanner} onClick={() => { setBannerPreviewUrl(null); setBannerImageUrl(null); }}>
            Remove
          </button>
        </div>
      ) : (
        <label className={styles.bannerDrop}>
          <ImagePlus size={22} aria-hidden="true" />
          <span className={styles.bannerDropTitle}>Add a cover image</span>
          <span className={styles.bannerDropSub}>PNG, JPEG, WebP or GIF — optional</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => void handleImageChange(event)}
            className={styles.fileInput}
          />
        </label>
      )}

      <div className={inputStyles.inputWrapper}>
        <label className={inputStyles.inputLabel} htmlFor="event-title">Event title</label>
        <input
          id="event-title"
          className={inputStyles.inputField}
          placeholder="e.g. Sunday Rooftop Mixer"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
        />
      </div>

      <div className={inputStyles.inputWrapper}>
        <label className={inputStyles.inputLabel} htmlFor="event-description">Description</label>
        <textarea
          id="event-description"
          className={`${inputStyles.inputField} ${styles.textarea}`}
          placeholder="What should people expect? Who is it for?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.gridTwo}>
        <DateField label="Starts" date={startDate} time={startTime} minDate={today}
          onDate={(picked) => {
            setStartDate(picked);
            if (!endDate || picked > endDate) {
              const suggested = new Date(picked);
              suggested.setHours(suggested.getHours() + 2);
              setEndDate(suggested);
            }
          }}
          onTime={setStartTime} />
        <DateField label="Ends" date={endDate} time={endTime} minDate={startDate ?? today}
          onDate={setEndDate} onTime={setEndTime} />
      </div>

      <div className={inputStyles.inputWrapper}>
        <span className={inputStyles.inputLabel}>Where is it happening?</span>
        <div className={styles.modeSwitch} role="group" aria-label="Event mode">
          <button
            type="button"
            className={`${styles.modeOption} ${mode === 'ONLINE' ? styles.modeActive : ''}`}
            onClick={() => setMode('ONLINE')}
            aria-pressed={mode === 'ONLINE'}
          >
            <Video size={16} aria-hidden="true" /> Online
          </button>
          <button
            type="button"
            className={`${styles.modeOption} ${mode === 'OFFLINE' ? styles.modeActive : ''}`}
            onClick={() => setMode('OFFLINE')}
            aria-pressed={mode === 'OFFLINE'}
          >
            <MapPin size={16} aria-hidden="true" /> In person
          </button>
        </div>
      </div>

      {mode === 'ONLINE' ? (
        <>
        <div className={styles.gridTwo}>
          <div className={inputStyles.inputWrapper}>
            <label className={inputStyles.inputLabel} htmlFor="event-url">Meeting link</label>
            <input id="event-url" className={inputStyles.inputField} placeholder="https://…" value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)} inputMode="url" />
          </div>
          <div className={inputStyles.inputWrapper}>
            <label className={inputStyles.inputLabel} htmlFor="event-platform">Platform <span className={styles.optional}>(optional)</span></label>
            <input id="event-platform" className={inputStyles.inputField} placeholder="Google Meet, Zoom…" value={platform}
              onChange={(event) => setPlatform(event.target.value)} />
          </div>
        </div>
        <div className={inputStyles.inputWrapper}>
          <label className={inputStyles.inputLabel} htmlFor="event-join">How to join <span className={styles.optional}>(optional — defaults to the meeting link)</span></label>
          <input id="event-join" className={inputStyles.inputField} placeholder="Group invite, livestream, or extra joining info…" value={joinUrl}
            onChange={(event) => setJoinUrl(event.target.value)} inputMode="url" />
        </div>
        </>
      ) : (
        <>
        <div className={styles.gridTwo}>
          <div className={inputStyles.inputWrapper}>
            <label className={inputStyles.inputLabel} htmlFor="event-venue">Venue</label>
            <input id="event-venue" className={inputStyles.inputField} placeholder="e.g. Skyline Café, Bandra" value={venue}
              onChange={(event) => setVenue(event.target.value)} />
          </div>
          <div className={inputStyles.inputWrapper}>
            <label className={inputStyles.inputLabel} htmlFor="event-location">City / area</label>
            <input id="event-location" className={inputStyles.inputField} placeholder="e.g. Mumbai" value={location}
              onChange={(event) => setLocation(event.target.value)} />
          </div>
        </div>
        <div className={inputStyles.inputWrapper}>
          <label className={inputStyles.inputLabel} htmlFor="event-join">How to join <span className={styles.optional}>(optional link — WhatsApp group, map pin, entry pass…)</span></label>
          <input id="event-join" className={inputStyles.inputField} placeholder="https://…" value={joinUrl}
            onChange={(event) => setJoinUrl(event.target.value)} inputMode="url" />
        </div>
        </>
      )}

      <div className={inputStyles.inputWrapper}>
        <label className={inputStyles.inputLabel} htmlFor="event-capacity">
          <span className={styles.capacityLabel}><Users size={14} aria-hidden="true" /> Capacity <span className={styles.optional}>(optional)</span></span>
        </label>
        <input id="event-capacity" className={`${inputStyles.inputField} ${styles.capacityInput}`} type="number" min={2}
          placeholder="e.g. 30" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => void submit()} disabled={saving || imageUploading}>
          {saving ? 'Creating…' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}

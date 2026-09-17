/**
 * Demo seed for the events-service database.
 *
 * Creates a small set of sample events (one live, several upcoming, one
 * ended) with demo attendees so the Events UI has real content to show.
 * Idempotent: every row is upserted by a stable demo id, so re-running
 * never duplicates. Real user-created events are never touched.
 *
 * Run with:  npx tsx src/seed.ts   (from backend/microservices/events-service)
 * Needs:     DATABASE_URL in backend/microservices/.env + postgres running
 *            (docker compose up -d from the repo-root db/ folder).
 */
import { prisma } from './config/database';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const DEMO_ATTENDEES = [
  'demo-user-aria',
  'demo-user-kabir',
  'demo-user-meera',
  'demo-user-arjun',
  'demo-user-zara',
  'demo-user-dev',
  'demo-user-anaya',
  'demo-user-vihaan',
];

interface DemoEvent {
  id: string;
  title: string;
  description: string;
  startOffsetMs: number;
  endOffsetMs: number;
  mode: 'ONLINE' | 'OFFLINE';
  meetingUrl?: string;
  platform?: string;
  venue?: string;
  location?: string;
  capacity?: number;
  going: number;
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    id: 'demo-event-speed-matching',
    title: 'Friday Speed Matching Night',
    description:
      'Five-minute video rounds, matched by intent. Bring one honest answer to: what are you actually looking for?',
    startOffsetMs: -1 * HOUR,
    endOffsetMs: 2 * HOUR,
    mode: 'ONLINE',
    meetingUrl: 'https://meet.ginivibe.app/speed-friday',
    platform: 'GiniVibe Rooms',
    capacity: 40,
    going: 8,
  },
  {
    id: 'demo-event-rooftop-mixer',
    title: 'Sunday Rooftop Mixer — Bandra',
    description:
      'Golden-hour meetup for people who prefer conversations over crowds. Hosted tables by interest: films, startups, poetry.',
    startOffsetMs: 2 * DAY,
    endOffsetMs: 2 * DAY + 3 * HOUR,
    mode: 'OFFLINE',
    venue: 'Skyline Café, Linking Road',
    location: 'Mumbai',
    capacity: 30,
    going: 6,
  },
  {
    id: 'demo-event-astro-workshop',
    title: 'Vedic Birth Chart Workshop',
    description:
      'Learn to read your own D1 chart: houses, lords, and what your Moon sign actually says about how you connect.',
    startOffsetMs: 4 * DAY,
    endOffsetMs: 4 * DAY + 2 * HOUR,
    mode: 'ONLINE',
    meetingUrl: 'https://meet.ginivibe.app/astro-101',
    platform: 'Google Meet',
    capacity: 100,
    going: 5,
  },
  {
    id: 'demo-event-startup-brunch',
    title: 'Founders & Builders Brunch',
    description:
      'No pitches, no panels. Just operators and early-stage founders trading notes over filter coffee.',
    startOffsetMs: 6 * DAY,
    endOffsetMs: 6 * DAY + 3 * HOUR,
    mode: 'OFFLINE',
    venue: 'Third Wave, Indiranagar',
    location: 'Bengaluru',
    capacity: 24,
    going: 4,
  },
  {
    id: 'demo-event-open-mic',
    title: 'Midnight Open Mic (Online)',
    description:
      'Poetry, standup, half-finished songs — all welcome. Sign-up slots open 30 minutes before we go live.',
    startOffsetMs: 8 * DAY,
    endOffsetMs: 8 * DAY + 2 * HOUR,
    mode: 'ONLINE',
    meetingUrl: 'https://meet.ginivibe.app/open-mic',
    platform: 'GiniVibe Rooms',
    capacity: 60,
    going: 3,
  },
  {
    id: 'demo-event-cricket-screening',
    title: 'India vs Australia — Live Screening',
    description:
      'Big screen, louder crowd. Our last watch party pulled 50 people; this one will be bigger.',
    startOffsetMs: -9 * DAY,
    endOffsetMs: -9 * DAY + 4 * HOUR,
    mode: 'OFFLINE',
    venue: 'Play Arena, HSR',
    location: 'Bengaluru',
    capacity: 50,
    going: 7,
  },
];

async function seedEvents() {
  console.log('🎪 Seeding demo events...');
  const now = Date.now();

  for (const demo of DEMO_EVENTS) {
    const event = await prisma.event.upsert({
      where: { id: demo.id },
      update: {
        title: demo.title,
        description: demo.description,
        startAt: new Date(now + demo.startOffsetMs),
        endAt: new Date(now + demo.endOffsetMs),
        mode: demo.mode,
        meetingUrl: demo.meetingUrl ?? null,
        platform: demo.platform ?? null,
        venue: demo.venue ?? null,
        location: demo.location ?? null,
        capacity: demo.capacity ?? null,
      },
      create: {
        id: demo.id,
        title: demo.title,
        description: demo.description,
        organizerId: 'demo-organizer-ginivibe',
        startAt: new Date(now + demo.startOffsetMs),
        endAt: new Date(now + demo.endOffsetMs),
        mode: demo.mode,
        meetingUrl: demo.meetingUrl ?? null,
        platform: demo.platform ?? null,
        venue: demo.venue ?? null,
        location: demo.location ?? null,
        capacity: demo.capacity ?? null,
      },
    });

    for (let i = 0; i < demo.going; i += 1) {
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: event.id, userId: DEMO_ATTENDEES[i % DEMO_ATTENDEES.length] } },
        update: { rsvpStatus: 'GOING' },
        create: { eventId: event.id, userId: DEMO_ATTENDEES[i % DEMO_ATTENDEES.length], rsvpStatus: 'GOING' },
      });
    }

    console.log(`  ✓ ${demo.title}`);
  }

  console.log('✅ Demo events seeded.');
}

seedEvents()
  .catch((error) => {
    console.error('❌ Events seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

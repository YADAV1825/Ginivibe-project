import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  // ESM-only package inside a CommonJS service: dynamic import.
  const { faker } = await import('@faker-js/faker');
  console.log('🌱 Starting Events Seeding...');

  const organizerId = '76f6f0ff-a994-4c78-8cc0-d59d18bfef74';

  // Clear existing events
  await prisma.event.deleteMany({});

  const arijitSingEvent = {
    title: 'Arijit Singh Live Concert 2026',
    description: 'Experience the soulful voice of Arijit Singh live in concert. Get ready for an evening of melody and emotions.',
    organizerId: organizerId,
    startAt: faker.date.future({ years: 1 }),
    endAt: faker.date.future({ years: 1, refDate: new Date(Date.now() + 1000000000) }),
    mode: 'OFFLINE' as const,
    venue: 'JLN Stadium',
    location: 'Delhi',
    capacity: 50000,
    bannerImageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop',
  };

  const otherEvents = [
    {
      title: 'Dubai Desert Safari & Party',
      description: 'Join us for an exclusive party in the dunes. High energy music and breathtaking views.',
      mode: 'OFFLINE' as const,
      venue: 'Desert Camp',
      location: 'Dubai',
      capacity: 500,
      bannerImageUrl: '/images/feed/dubai_party.webp'
    },
    {
      title: 'Mountain Retreat Networking',
      description: 'A peaceful getaway for founders to disconnect and network in the hills.',
      mode: 'OFFLINE' as const,
      venue: 'Himalayan Resort',
      location: 'Manali',
      capacity: 50,
      bannerImageUrl: '/images/feed/sunset-over-mountains-stockcake_mobile 16:9 photo.jpg'
    },
    {
      title: 'Luxury Yacht Cruise',
      description: 'Set sail with fellow entrepreneurs and investors on a luxury yacht along the coast.',
      mode: 'OFFLINE' as const,
      venue: 'Marina Bay',
      location: 'Mumbai',
      capacity: 120,
      bannerImageUrl: '/images/feed/yacht.webp'
    },
    {
      title: 'Digital Marketing Masterclass',
      description: 'Learn the secrets of scaling your business online with industry experts.',
      mode: 'ONLINE' as const,
      meetingUrl: 'https://zoom.us/j/123456789',
      location: 'Online',
      capacity: 1000,
      bannerImageUrl: '/images/feed/Ads.jpeg'
    }
  ];

  await prisma.event.create({ data: arijitSingEvent });

  for (const ev of otherEvents) {
    const startAt = faker.date.future({ years: 1 });
    const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

    await prisma.event.create({
      data: {
        ...ev,
        organizerId: organizerId,
        startAt,
        endAt,
      }
    });
  }

  console.log('✅ Seeded 5 events.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const interestsData = [
  {
    name: 'Art',
    subInterests: [
      'Digital Art',
      'Photography',
      'Painting',
      'Graphic Design',
      'Standup Comedy',
    ],
  },
  {
    name: 'Beauty',
    subInterests: [
      'Skincare',
      'Makeup',
      'Haircare',
      'Fashion',
    ],
  },
  {
    name: 'Career',
    subInterests: [
      'Job Search',
      'Software Engineering',
      'IT Services',
      'Civil Services',
      'Entrepreneurship',
    ],
  },
  {
    name: 'Technology',
    subInterests: [
      'Software Engineering',
      'AI Developments',
      'Data Science',
      'Gadgets',
      'Smartphones',
      'IT Services',
    ],
  },
  {
    name: 'Finance',
    subInterests: [
      'Investing',
      'Stock Market',
      'Nifty 50',
      'Personal Finance',
      'Cryptocurrency',
      'Indian Economy',
    ],
  },
  {
    name: 'Food',
    subInterests: [
      'Recipes',
      'Street Food',
      'Restaurants',
      'Baking',
    ],
  },
  {
    name: 'Sports',
    subInterests: [
      'Cricket',
      'Indian Premier League',
      'Premier League',
      'Football',
      'Tennis',
      'Fitness',
    ],
  },
  {
    name: 'Entertainment',
    subInterests: [
      'Bollywood',
      'Hollywood Movies',
      'Punjabi Music',
      'World News',
    ],
  },
  {
    name: 'Gaming',
    subInterests: [
      'PC Gaming',
      'Console Gaming',
      'Mobile Gaming',
      'Esports',
      'Electric Vehicles',
    ],
  },
  {
    name: 'News',
    subInterests: [
      'World News',
      'Indian Economy',
      'Digital India',
      'Marketing',
    ],
  },
  {
    name: 'Travel',
    subInterests: [
      'Cars',
      'Digital India',
      'Photography',
      'AgriTech',
    ],
  },
  {
    name: 'Wellness',
    subInterests: [
      'Fitness',
      'Mental Health',
      'Yoga',
      'Meditation',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const interestData of interestsData) {
    const interest = await prisma.interest.upsert({
      where: {
        name: interestData.name,
      },
      update: {},
      create: {
        name: interestData.name,
      },
    });

    console.log(`Interest: ${interest.name}`);

    for (const subInterestName of interestData.subInterests) {
      await prisma.subInterest.upsert({
        where: {
          name_interestId: {
            name: subInterestName,
            interestId: interest.id,
          },
        },
        update: {},
        create: {
          name: subInterestName,
          interestId: interest.id,
        },
      });

      console.log(`  └── ${subInterestName}`);
    }
  }

  console.log('✅ Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
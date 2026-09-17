import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Starting Post Cleanup and Re-seeding...');

  // Delete existing posts
  await prisma.post.deleteMany({});
  console.log('Deleted old posts.');

  const mainUser = await prisma.user.findUnique({
    where: { email: 'yrohit1825@gmail.com' }
  });

  if (!mainUser) {
    console.error('Could not find main user to author posts!');
    return;
  }

  // Create 5 new posts with English/Hindi text and real images
  const posts = [
    {
      title: 'Amazing night in Dubai!',
      body: 'Just attended the best party in Dubai. The vibes were immaculate, and the city lights are something else. Never want to leave! 🌃✨',
      mediaUrls: ['http://localhost:3000/images/feed/dubai_party.webp']
    },
    {
      title: 'Serene Sunset',
      body: 'Spent the evening in the mountains watching this incredible sunset. There is nothing quite like the peace of nature. ⛰️🌅',
      mediaUrls: ['http://localhost:3000/images/feed/sunset-over-mountains-stockcake_mobile%2016:9%20photo.jpg']
    },
    {
      title: 'Yacht Life',
      body: 'Sailing through the crystal clear waters. Taking a break from the hustle and enjoying the breeze. 🛥️🌊',
      mediaUrls: ['http://localhost:3000/images/feed/yacht.webp']
    },
    {
      title: 'Ad Inspiration',
      body: 'Saw this cool advertisement today. The design is super clean and minimal. Taking some notes for my next project! 📝',
      mediaUrls: ['http://localhost:3000/images/feed/Ads.jpeg']
    },
    {
      title: 'Weekend Getaway',
      body: 'क्या शानदार वीकेंड था! दोस्तों के साथ समय बिताना और नई जगहों को एक्सप्लोर करना हमेशा अच्छा लगता है। (What an amazing weekend! Spending time with friends and exploring new places is always great.)',
      mediaUrls: ['http://localhost:3000/images/feed/dubai_party.webp']
    }
  ];

  for (const postData of posts) {
    await prisma.post.create({
      data: {
        userId: mainUser.id,
        title: postData.title,
        body: postData.body,
        contentType: 'image',
        mediaUrls: postData.mediaUrls,
        viewsCount: Math.floor(Math.random() * 500) + 50,
        createdAt: new Date()
      }
    });
  }

  console.log('✅ Seeded 5 new English/Hindi posts with local images.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
